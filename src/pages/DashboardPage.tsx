// src/pages/DashboardPage.tsx
// Payments dashboard — received invoices + outgoing payments + residual tracking

import { useState } from 'react';
import { TrendingUp, ArrowDownLeft, ArrowUpRight, Copy, Check, ExternalLink, Zap } from 'lucide-react';

// ─── Mock data ────────────────────────────────────────────────────────────────

type TxStatus = 'SETTLED' | 'PENDING' | 'PROCESSING';

type ReceivedPayment = {
  id: string;
  from: string;       // EVM address (partial)
  amount: string;
  asset: string;
  residualSeeded: string;
  tonWallet: string;
  timestamp: string;
  status: TxStatus;
  txHash: string;
  isAffiliate: boolean;
  affiliateEarned?: string;
};

type SentPayment = {
  id: string;
  merchant: string;
  amount: string;
  asset: string;
  youSent: string;
  residualCaptured: string;
  tonWallet: string;
  timestamp: string;
  status: TxStatus;
  txHash: string;
  gasless: boolean;
};
const RECEIVED: ReceivedPayment[] = [];
const SENT: SentPayment[] = [];

// ─── KPI cards ────────────────────────────────────────────────────────────────

const totalReceived = RECEIVED
  .filter(r => r.status === 'SETTLED')
  .reduce((s, r) => s + parseFloat(r.amount), 0);

const totalSent = SENT
  .filter(s => s.status === 'SETTLED')
  .reduce((s, p) => s + parseFloat(p.amount), 0);

const totalResidualReceiver = RECEIVED
  .filter(r => r.status === 'SETTLED')
  .reduce((s, r) => s + parseFloat(r.residualSeeded || '0'), 0);

const totalResidualSent = SENT
  .filter(s => s.status === 'SETTLED')
  .reduce((s, p) => s + parseFloat(p.residualCaptured), 0);

const totalAffiliateEarned = RECEIVED
  .filter(r => r.isAffiliate && r.affiliateEarned)
  .reduce((s, r) => s + parseFloat(r.affiliateEarned!), 0);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: TxStatus }) => {
  const cfg = {
    SETTLED:    { label: 'Settled',    color: 'var(--success)',  bg: 'var(--success-muted)', border: 'rgba(52,211,153,0.2)' },
    PENDING:    { label: 'Pending',    color: 'var(--warning)',  bg: 'var(--warning-muted)', border: 'rgba(251,191,36,0.2)' },
    PROCESSING: { label: 'Routing…',  color: 'var(--accent)',   bg: 'var(--accent-muted)',  border: 'rgba(45,212,191,0.2)' },
  }[status];
  return (
    <span style={{
      fontFamily: 'var(--font-sans)',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '6px',
      padding: '3px 10px',
    }}>
      {cfg.label}
    </span>
  );
};

const TxLink = ({ hash }: { hash: string }) => {
  if (!hash) return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-disabled)' }}>—</span>;
  return (
    <a
      href={`https://tonscan.org/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
    >
      {hash.slice(0, 8)}…{hash.slice(-6)}
      <ExternalLink size={9} />
    </a>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="page-wide">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <span className="section-label">Payment dashboard</span>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '26px', fontWeight: 700, marginTop: '12px', letterSpacing: '-0.02em' }}>
          Transaction History
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
          All invoices you've issued and payments you've made via STN-Delta.
        </p>
      </div>

      {/* ─── KPI Row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total received',        value: `$${totalReceived.toFixed(2)}`,       color: 'var(--success)', icon: <ArrowDownLeft size={14} /> },
          { label: 'Total paid out',         value: `$${totalSent.toFixed(2)}`,           color: 'var(--text-primary)', icon: <ArrowUpRight size={14} /> },
          { label: 'Residual seeded (in)',   value: `$${totalResidualReceiver.toFixed(2)}`, color: 'var(--accent)', icon: <Zap size={14} /> },
          { label: 'Residual captured (out)',value: `$${totalResidualSent.toFixed(2)}`,   color: 'var(--accent)', icon: <Zap size={14} /> },
          { label: 'Affiliate earned',       value: `$${totalAffiliateEarned.toFixed(2)}`, color: 'var(--warning)', icon: <TrendingUp size={14} /> },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <span style={{ color: kpi.color }}>{kpi.icon}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500 }}>
                {kpi.label}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: kpi.color, letterSpacing: '-0.02em' }}>
              {kpi.value}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-disabled)', marginTop: '6px' }}>
              USDT
            </div>
          </div>
        ))}
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────── */}
      <div className="tab-bar" style={{ maxWidth: 340, marginBottom: '24px' }}>
        <button
          className={`tab-item ${tab === 'received' ? 'active' : ''}`}
          onClick={() => setTab('received')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowDownLeft size={12} />
          Received ({RECEIVED.length})
        </button>
        <button
          className={`tab-item ${tab === 'sent' ? 'active' : ''}`}
          onClick={() => setTab('sent')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowUpRight size={12} />
          Paid ({SENT.length})
        </button>
      </div>

      {/* ─── RECEIVED TABLE ──────────────────────────────────────────────── */}
      {tab === 'received' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.9fr 0.7fr',
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-hover)',
          }}>
            {['Invoice ID', 'From (EVM)', 'Amount', 'Residual seeded', 'TON wallet', 'Time', 'Status'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                {h}
              </div>
            ))}
          </div>

          {RECEIVED.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.9fr 0.7fr',
                padding: '16px 24px',
                borderBottom: i < RECEIVED.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* ID */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                  {r.id}
                </div>
                {r.isAffiliate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Zap size={10} color="var(--warning)" />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--warning)' }}>
                      Affiliate +${r.affiliateEarned}
                    </span>
                  </div>
                )}
                <TxLink hash={r.txHash} />
              </div>

              {/* From */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {r.from}
              </div>

              {/* Amount */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--success)' }}>
                ${r.amount}
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{r.asset}</div>
              </div>

              {/* Residual */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: r.residualSeeded !== '0.00' ? 'var(--accent)' : 'var(--text-disabled)' }}>
                {r.residualSeeded !== '0.00' ? `$${r.residualSeeded}` : '—'}
              </div>

              {/* TON Wallet */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                {r.tonWallet !== '—' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {r.tonWallet}
                    <button
                      className={`copy-btn ${copied === r.id ? 'copied' : ''}`}
                      onClick={() => copy(r.id, r.tonWallet)}
                      style={{ padding: '2px 4px' }}
                    >
                      {copied === r.id ? <Check size={9} /> : <Copy size={9} />}
                    </button>
                  </div>
                ) : '—'}
              </div>

              {/* Time */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {r.timestamp}
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── SENT TABLE ──────────────────────────────────────────────────── */}
      {tab === 'sent' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.9fr 0.8fr 0.7fr 0.8fr 0.8fr 0.7fr 0.6fr',
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-hover)',
          }}>
            {['Invoice ID', 'Merchant', 'You paid', 'You sent', 'Residual kept', 'TON wallet', 'Time', 'Status'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                {h}
              </div>
            ))}
          </div>

          {SENT.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.9fr 0.8fr 0.7fr 0.8fr 0.8fr 0.7fr 0.6fr',
                padding: '16px 24px',
                borderBottom: i < SENT.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* ID */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>
                  {s.id}
                </div>
                {s.gasless && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Zap size={10} color="var(--accent)" />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--accent)' }}>
                      Gasless
                    </span>
                  </div>
                )}
                <TxLink hash={s.txHash} />
              </div>

              {/* Merchant */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {s.merchant}
              </div>

              {/* You Paid (invoice amount) */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                ${s.amount}
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{s.asset}</div>
              </div>

              {/* You Sent (with buffer) */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                ${s.youSent}
              </div>

              {/* Residual Captured */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>
                ${s.residualCaptured}
              </div>

              {/* TON Wallet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {s.tonWallet}
                </span>
                <button
                  className={`copy-btn ${copied === s.id ? 'copied' : ''}`}
                  onClick={() => copy(s.id, s.tonWallet)}
                  style={{ padding: '2px 4px' }}
                >
                  {copied === s.id ? <Check size={9} /> : <Copy size={9} />}
                </button>
              </div>

              {/* Time */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                {s.timestamp}
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Empty state hint ─────────────────────────────────────────────── */}
      <div style={{
        marginTop: '20px',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        color: 'var(--text-disabled)',
        textAlign: 'center',
      }}>
        Showing simulated history · Real transactions indexed from TON chain on-chain events
      </div>
    </div>
  );
};
