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

const RECEIVED: ReceivedPayment[] = [
  {
    id: 'INV-LTK5B2-XQ91',
    from: '0x1a2b...f3e4',
    amount: '120.00',
    asset: 'USDT',
    residualSeeded: '3.28',
    tonWallet: 'UQDm4...8bA1',
    timestamp: '2026-06-06 21:44',
    status: 'SETTLED',
    txHash: '0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    isAffiliate: true,
    affiliateEarned: '0.24',
  },
  {
    id: 'INV-LTK4C1-MN77',
    from: '0x9c8d...a2b1',
    amount: '50.00',
    asset: 'USDT',
    residualSeeded: '3.65',
    tonWallet: 'UQAb9...22Zc',
    timestamp: '2026-06-06 20:11',
    status: 'SETTLED',
    txHash: '0xb2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
    isAffiliate: false,
  },
  {
    id: 'INV-LTK3B9-PP44',
    from: '0x3f4e...c5d6',
    amount: '75.50',
    asset: 'USDT',
    residualSeeded: '0.00',
    tonWallet: '—',
    timestamp: '2026-06-06 18:30',
    status: 'PROCESSING',
    txHash: '0xc3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    isAffiliate: false,
  },
  {
    id: 'INV-LTK2A7-QQ11',
    from: '0x7g8h...e9f0',
    amount: '200.00',
    asset: 'USDT',
    residualSeeded: '4.12',
    tonWallet: 'UQRx1...77Yz',
    timestamp: '2026-06-06 15:05',
    status: 'SETTLED',
    txHash: '0xd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    isAffiliate: true,
    affiliateEarned: '0.40',
  },
  {
    id: 'INV-LTK1Z3-RR22',
    from: '0xab1c...2d3e',
    amount: '30.00',
    asset: 'USDT',
    residualSeeded: '0.00',
    tonWallet: '—',
    timestamp: '2026-06-06 12:00',
    status: 'PENDING',
    txHash: '',
    isAffiliate: false,
  },
];

const SENT: SentPayment[] = [
  {
    id: 'INV-DEMO-2026',
    merchant: 'EQAmer...5678',
    amount: '50.00',
    asset: 'USDT',
    youSent: '55.00',
    residualCaptured: '3.65',
    tonWallet: 'UQCx9...44Ab',
    timestamp: '2026-06-06 20:05',
    status: 'SETTLED',
    txHash: '0xe5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
    gasless: true,
  },
  {
    id: 'INV-LTK4D2-SS88',
    merchant: 'EQBjoh...9012',
    amount: '300.00',
    asset: 'USDT',
    youSent: '305.00',
    residualCaptured: '4.72',
    tonWallet: 'UQKb2...11Mm',
    timestamp: '2026-06-05 14:22',
    status: 'SETTLED',
    txHash: '0xf6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
    gasless: false,
  },
];

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
    SETTLED:    { label: 'Settled',    color: 'var(--color-emerald)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    PENDING:    { label: 'Pending',    color: 'var(--color-amber)',   bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    PROCESSING: { label: 'Routing…',  color: 'var(--color-cyan)',    bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)' },
  }[status];
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '3px',
      padding: '2px 6px',
    }}>
      {cfg.label}
    </span>
  );
};

const TxLink = ({ hash }: { hash: string }) => {
  if (!hash) return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-600)' }}>—</span>;
  return (
    <a
      href={`https://tonscan.org/tx/${hash}`}
      target="_blank"
      rel="noreferrer"
      style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
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
      <div style={{ marginBottom: '28px' }}>
        <span className="section-label">PAYMENT DASHBOARD</span>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '10px' }}>
          Transaction History
        </h1>
        <p style={{ color: 'var(--color-slate-400)', fontSize: '13px', marginTop: '6px' }}>
          All invoices you've issued and payments you've made via STN-Delta.
        </p>
      </div>

      {/* ─── KPI Row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Received',      value: `$${totalReceived.toFixed(2)}`,       color: 'var(--color-emerald)', icon: <ArrowDownLeft size={14} /> },
          { label: 'Total Paid Out',       value: `$${totalSent.toFixed(2)}`,           color: 'var(--color-slate-200)', icon: <ArrowUpRight size={14} /> },
          { label: 'Residual Seeded (In)', value: `$${totalResidualReceiver.toFixed(2)}`, color: 'var(--color-cyan)', icon: <Zap size={14} /> },
          { label: 'Residual Captured (Out)', value: `$${totalResidualSent.toFixed(2)}`, color: 'var(--color-cyan)', icon: <Zap size={14} /> },
          { label: 'Affiliate Earned',     value: `$${totalAffiliateEarned.toFixed(2)}`, color: 'var(--color-amber)', icon: <TrendingUp size={14} /> },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: kpi.color, marginBottom: '8px' }}>
              {kpi.icon}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {kpi.label}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: kpi.color }}>
              {kpi.value}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-600)', marginTop: '4px' }}>
              USDT
            </div>
          </div>
        ))}
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────── */}
      <div className="tab-bar" style={{ maxWidth: 340, marginBottom: '20px' }}>
        <button
          className={`tab-item ${tab === 'received' ? 'active' : ''}`}
          onClick={() => setTab('received')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowDownLeft size={11} />
          Received ({RECEIVED.length})
        </button>
        <button
          className={`tab-item ${tab === 'sent' ? 'active' : ''}`}
          onClick={() => setTab('sent')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowUpRight size={11} />
          Paid ({SENT.length})
        </button>
      </div>

      {/* ─── RECEIVED TABLE ──────────────────────────────────────────────── */}
      {tab === 'received' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.9fr 0.7fr',
            padding: '10px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {['Invoice ID', 'From (EVM)', 'Amount', 'Residual Seeded', 'TON Wallet', 'Time', 'Status'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--color-slate-600)', textTransform: 'uppercase' }}>
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
                padding: '14px 20px',
                borderBottom: i < RECEIVED.length - 1 ? '1px solid var(--color-border)' : 'none',
                alignItems: 'center',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* ID */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-slate-200)' }}>
                  {r.id}
                </div>
                {r.isAffiliate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    <Zap size={9} color="var(--color-amber)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-amber)' }}>
                      Affiliate +${r.affiliateEarned}
                    </span>
                  </div>
                )}
                <TxLink hash={r.txHash} />
              </div>

              {/* From */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-slate-400)' }}>
                {r.from}
              </div>

              {/* Amount */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald)' }}>
                ${r.amount}
                <div style={{ fontSize: '10px', color: 'var(--color-slate-500)', fontWeight: 400 }}>{r.asset}</div>
              </div>

              {/* Residual */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: r.residualSeeded !== '0.00' ? 'var(--color-cyan)' : 'var(--color-slate-600)' }}>
                {r.residualSeeded !== '0.00' ? `$${r.residualSeeded}` : '—'}
              </div>

              {/* TON Wallet */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-400)' }}>
                {r.tonWallet !== '—' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {r.tonWallet}
                    <button
                      className={`copy-btn ${copied === r.id ? 'copied' : ''}`}
                      onClick={() => copy(r.id, r.tonWallet)}
                      style={{ padding: '2px 4px' }}
                    >
                      {copied === r.id ? <Check size={8} /> : <Copy size={8} />}
                    </button>
                  </div>
                ) : '—'}
              </div>

              {/* Time */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)' }}>
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
            padding: '10px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {['Invoice ID', 'Merchant', 'You Paid', 'You Sent', 'Residual Kept', 'TON Wallet', 'Time', 'Status'].map(h => (
              <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--color-slate-600)', textTransform: 'uppercase' }}>
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
                padding: '14px 20px',
                borderBottom: i < SENT.length - 1 ? '1px solid var(--color-border)' : 'none',
                alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* ID */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-slate-200)' }}>
                  {s.id}
                </div>
                {s.gasless && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    <Zap size={9} color="var(--color-cyan)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-cyan)' }}>
                      Gasless
                    </span>
                  </div>
                )}
                <TxLink hash={s.txHash} />
              </div>

              {/* Merchant */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-slate-400)' }}>
                {s.merchant}
              </div>

              {/* You Paid (invoice amount) */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--color-slate-200)' }}>
                ${s.amount}
                <div style={{ fontSize: '10px', color: 'var(--color-slate-500)', fontWeight: 400 }}>{s.asset}</div>
              </div>

              {/* You Sent (with buffer) */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-slate-500)' }}>
                ${s.youSent}
              </div>

              {/* Residual Captured */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-cyan)' }}>
                ${s.residualCaptured}
              </div>

              {/* TON Wallet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-400)' }}>
                  {s.tonWallet}
                </span>
                <button
                  className={`copy-btn ${copied === s.id ? 'copied' : ''}`}
                  onClick={() => copy(s.id, s.tonWallet)}
                  style={{ padding: '2px 4px' }}
                >
                  {copied === s.id ? <Check size={8} /> : <Copy size={8} />}
                </button>
              </div>

              {/* Time */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)' }}>
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
        marginTop: '16px',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--color-slate-700)',
        textAlign: 'center',
        letterSpacing: '0.06em',
      }}>
        SHOWING SIMULATED HISTORY · REAL TRANSACTIONS INDEXED FROM TON CHAIN ON-CHAIN EVENTS
      </div>
    </div>
  );
};
