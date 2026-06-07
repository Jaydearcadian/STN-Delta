// src/components/DeltaDashboard.tsx
// Core gateway checkout card — 5-state lifecycle for EVM → TON invoice settlement

import { useState } from 'react';
import { Shield, ArrowRight, Lock, Zap, Copy, Check, Wallet, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import type { InvoiceState, AffiliateInvoiceState } from '../utils/codec';
import { useDeltaEngine } from '../hooks/useDeltaEngine';
import { TerminalLog } from './TerminalLog';
import { SuccessPanel } from './SuccessPanel';

type Props = {
  invoice: InvoiceState | null;
  affiliateData: AffiliateInvoiceState | null;
};

const USER_BUFFER = 55.00;

export const DeltaDashboard = ({ invoice, affiliateData }: Props) => {
  const { address: evmAddress } = useAccount();
  const engine = useDeltaEngine(invoice, affiliateData, evmAddress);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const activeInvoice = affiliateData ?? invoice;
  if (!activeInvoice) return null;

  const copyAddress = () => {
    if (engine.tonIdentity) {
      navigator.clipboard.writeText(engine.tonIdentity.address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const residualUsdt = parseFloat(engine.metrics.residualGas);
  const invoiceAmount = parseFloat(activeInvoice.amount);
  const requiredInput = parseFloat(engine.metrics.requiredInputUsdc);

  // Progress steps for LOCKING / SETTLING states
  const progressPct =
    engine.state === 'LOCKING_EVM' ? 33 :
    engine.state === 'SWAP_SETTLING' ? 66 :
    engine.state === 'SUCCESS_VALEDICTORY' ? 100 : 0;

  return (
    <div style={{ width: '100%', maxWidth: 460, margin: '0 auto' }}>
      {/* ─── CARD ─────────────────────────────────────────────────────────── */}
      <div className="card card-cyan-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ─── HYDRATING ────────────────────────────────────────────────── */}
        {engine.state === 'HYDRATING' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-slate-400)' }}>
              Initialising Omniston routes &amp; generating keypairs
              <span className="animate-blink">_</span>
            </div>
          </div>
        )}

        {/* ─── ROUTE_STREAM ─────────────────────────────────────────────── */}
        {engine.state === 'ROUTE_STREAM' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Invoice intent header */}
            <div>
              <span className="section-label">
                {affiliateData ? '🔗 AFFILIATE INVOICE' : 'INBOUND INVOICE'}
              </span>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                  ${invoiceAmount.toFixed(2)}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-slate-400)' }}>
                  {activeInvoice.assetSymbol} on TON
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-600)', marginTop: '6px' }}>
                REF: {activeInvoice.id}
              </div>
            </div>

            {/* Affiliate ribbon */}
            {affiliateData && (
              <div className="banner banner-amber" style={{ padding: '8px 12px', fontSize: '11px' }}>
                <Zap size={12} color="var(--color-amber)" style={{ flexShrink: 0 }} />
                <span>
                  Referral link — <strong style={{ color: 'var(--color-amber)' }}>0.2% fee</strong> auto-paid to{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-300)' }}>
                    {affiliateData.affiliateAlias ?? affiliateData.affiliateWallet.slice(0, 12) + '...'}
                  </span>
                </span>
              </div>
            )}

            {/* Omniston metrics */}
            <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="metric-row">
                <span className="metric-label">You send</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff', fontSize: '14px' }}>
                  ${USER_BUFFER.toFixed(2)} USDC
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)', marginLeft: '6px', fontWeight: 400 }}>
                    (Base)
                  </span>
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Omniston input required</span>
                <span className="metric-value cyan">
                  {requiredInput > 0 ? `$${engine.metrics.requiredInputUsdc}` : '—'} USDC
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Slippage bound</span>
                <span className="metric-value">{engine.metrics.slippageBps > 0 ? `${(engine.metrics.slippageBps / 100).toFixed(2)}%` : '—'}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Settlement method</span>
                <span className="metric-value" style={{ fontSize: '10px' }}>HTLC Atomic Swap</span>
              </div>
              <hr className="metric-divider" />
              <div className="metric-row">
                <span className="metric-label">Merchant receives</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-emerald)', fontSize: '13px' }}>
                  ${invoiceAmount.toFixed(2)} USDT ✓
                </span>
              </div>
              {engine.isGasless && (
                <div className="metric-row">
                  <span className="metric-label">Gas sponsor deduction</span>
                  <span className="metric-value amber">−${engine.metrics.gasSponsorDeduction} USDC</span>
                </div>
              )}
              <div className="metric-row" style={{ paddingTop: '4px' }}>
                <span className="metric-label" style={{ color: 'var(--color-cyan)' }}>Your residual captured</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-cyan)', fontSize: '14px' }}>
                  ${engine.metrics.residualGas}
                </span>
              </div>
            </div>

            {/* ─── RESIDUAL ROUTING CHOICE ─────────────────────────────── */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-600)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                RESIDUAL ${engine.metrics.residualGas} — WHERE SHOULD IT GO?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>

                {/* Option A: New TON Wallet */}
                <label
                  className={`toggle-row ${engine.residualRoute === 'TON_WALLET' ? 'active' : ''}`}
                  onClick={() => engine.setResidualRoute('TON_WALLET')}
                  style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '12px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <div className={`toggle-checkbox ${engine.residualRoute === 'TON_WALLET' ? 'checked' : ''}`}>
                      {engine.residualRoute === 'TON_WALLET' && <Check size={10} color="#020617" />}
                    </div>
                    <Shield size={12} color={engine.residualRoute === 'TON_WALLET' ? 'var(--color-cyan)' : 'var(--color-slate-600)'} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: engine.residualRoute === 'TON_WALLET' ? 'var(--color-cyan)' : 'var(--color-slate-400)' }}>
                      New TON Wallet
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-600)', lineHeight: 1.5, paddingLeft: '28px' }}>
                    Generate wallet + seed with gas. Onboard to TON DeFi instantly.
                  </div>
                </label>

                {/* Option B: Return to EVM */}
                <label
                  className={`toggle-row ${engine.residualRoute === 'EVM_RETURN' ? 'active' : ''}`}
                  onClick={() => engine.setResidualRoute('EVM_RETURN')}
                  style={{
                    cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '12px',
                    borderColor: engine.residualRoute === 'EVM_RETURN' ? 'rgba(34,211,238,0.3)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <div className={`toggle-checkbox ${engine.residualRoute === 'EVM_RETURN' ? 'checked' : ''}`}>
                      {engine.residualRoute === 'EVM_RETURN' && <Check size={10} color="#020617" />}
                    </div>
                    <RefreshCw size={12} color={engine.residualRoute === 'EVM_RETURN' ? 'var(--color-cyan)' : 'var(--color-slate-600)'} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: engine.residualRoute === 'EVM_RETURN' ? 'var(--color-cyan)' : 'var(--color-slate-400)' }}>
                      Return to EVM
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-600)', lineHeight: 1.5, paddingLeft: '28px' }}>
                    Send USDC back to your connected wallet on Base.
                  </div>
                </label>
              </div>

              {/* Show relevant detail under selected option */}
              {engine.residualRoute === 'TON_WALLET' && engine.tonIdentity && (
                <div className="banner banner-cyan" style={{ marginTop: '8px', padding: '8px 12px' }}>
                  <Shield size={11} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-500)', marginBottom: '3px' }}>NEW TON ADDRESS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="address-box" style={{ flex: 1, fontSize: '9px' }}>{engine.tonIdentity.address}</div>
                      <button className={`copy-btn ${copiedAddr ? 'copied' : ''}`} onClick={copyAddress}>
                        {copiedAddr ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {engine.residualRoute === 'EVM_RETURN' && (
                <div className="banner banner-cyan" style={{ marginTop: '8px', padding: '8px 12px' }}>
                  <Wallet size={11} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                    <div style={{ color: 'var(--color-slate-500)', marginBottom: '2px', fontSize: '9px' }}>RETURN TO</div>
                    {evmAddress
                      ? <span style={{ color: 'var(--color-slate-200)' }}>{evmAddress.slice(0, 14)}…{evmAddress.slice(-8)}</span>
                      : <span style={{ color: 'var(--color-amber)' }}>⚠ Connect your EVM wallet first</span>
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Gasless EVM onboarding toggle */}
            <div>
              <label
                className={`toggle-row ${engine.isGasless ? 'active' : ''}`}
                onClick={engine.toggleGasless}
                style={{ cursor: 'pointer' }}
              >
                <div className={`toggle-checkbox ${engine.isGasless ? 'checked' : ''}`}>
                  {engine.isGasless && <Check size={10} color="#020617" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: 'var(--color-slate-200)' }}>
                    Gasless EVM Onboarding
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                    Sponsor TON wallet deployment gas from $0.42 of your inbound USDC — no native TON needed
                  </div>
                </div>
                <Zap size={14} color={engine.isGasless ? 'var(--color-cyan)' : 'var(--color-slate-600)'} />
              </label>
            </div>

            {/* Route hops */}
            {engine.metrics.routeHops.length > 0 && (
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-600)', letterSpacing: '0.1em', marginBottom: '6px' }}>
                  ROUTE PATH
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {engine.metrics.routeHops.map((hop, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: i === 0 ? 'var(--color-cyan)' : i === engine.metrics.routeHops.length - 1 ? 'var(--color-emerald)' : 'var(--color-slate-600)',
                      }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-400)' }}>
                        {hop}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal log */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-600)', letterSpacing: '0.1em', marginBottom: '6px' }}>
                OMNISTON STREAM
              </div>
              <TerminalLog logs={engine.log} />
            </div>

            {/* Authorize CTA */}
            <button
              id="authorize-payment-btn"
              className="btn btn-primary btn-full"
              onClick={engine.executePayment}
              disabled={engine.metrics.quoteId === ''}
              style={{ fontSize: '12px' }}
            >
              <Lock size={13} />
              AUTHORIZE PAYMENT ORDER
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* ─── LOCKING_EVM + SWAP_SETTLING ──────────────────────────────── */}
        {(engine.state === 'LOCKING_EVM' || engine.state === 'SWAP_SETTLING') && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', paddingTop: '16px' }}>
              <div style={{ position: 'relative', width: 52, height: 52, margin: '0 auto 16px' }}>
                <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--color-border)', borderRadius: '50%' }} />
                <div className="animate-spin" style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: 'var(--color-cyan)', borderRadius: '50%' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                {engine.state === 'LOCKING_EVM' ? 'Awaiting EVM Signature' : 'Routing via Omniston'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-slate-500)', marginTop: '4px' }}>
                {engine.state === 'LOCKING_EVM'
                  ? 'Confirm transaction in your EVM wallet...'
                  : 'HTLC resolvers finalising settlement on TON...'}
              </div>
            </div>

            {/* Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-600)', marginBottom: '6px' }}>
                <span>EVM LOCK</span>
                <span>HTLC RELAY</span>
                <span>TON SETTLE</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Live log */}
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-600)', letterSpacing: '0.1em', marginBottom: '6px' }}>
                SETTLEMENT LOG
              </div>
              <TerminalLog logs={engine.log} />
            </div>
          </div>
        )}

        {/* ─── SUCCESS_VALEDICTORY ───────────────────────────────────────── */}
        {engine.state === 'SUCCESS_VALEDICTORY' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Residual outcome notice */}
            {engine.residualRoute === 'EVM_RETURN' ? (
              <div className="banner banner-emerald" style={{ padding: '14px' }}>
                <RefreshCw size={16} color="var(--color-emerald)" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-emerald)', marginBottom: '3px' }}>RESIDUAL RETURNED TO EVM</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate-300)' }}>
                    ${engine.metrics.residualGas} USDC returned to{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-slate-400)', fontSize: '11px' }}>
                      {evmAddress ? `${evmAddress.slice(0,10)}…${evmAddress.slice(-6)}` : 'your wallet'}
                    </span>
                  </div>
                </div>
              </div>
            ) : engine.tonIdentity ? (
              <SuccessPanel
                residualUsdt={residualUsdt}
                tonIdentity={engine.tonIdentity}
                invoiceAmount={activeInvoice.amount}
                merchantAddress={activeInvoice.merchant}
              />
            ) : null}

            {/* Mnemonic — only for TON wallet route */}
            {engine.residualRoute === 'TON_WALLET' && engine.tonIdentity && (
              <div className="card-inner">
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠</span> SAVE YOUR TON WALLET RECOVERY PHRASE
                </div>
                <div className="mnemonic-grid">
                  {engine.tonIdentity.mnemonic.map((word, i) => (
                    <div key={i} className="mnemonic-word">
                      <span className="mnemonic-index">{i + 1}.</span>
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affiliate commission notice */}
            {engine.isAffiliate && (
              <div className="banner banner-amber" style={{ fontSize: '11px' }}>
                <Zap size={12} color="var(--color-amber)" />
                <span>
                  <strong>${engine.affiliateCommissionUsdt} USDC</strong> (0.2% of swap) automatically transferred to referrer's wallet
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD FOOTER ───────────────────────────────────────────────────── */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: 'var(--color-slate-700)',
        textAlign: 'center',
        marginTop: '12px',
        letterSpacing: '0.06em',
      }}>
        POWERED BY OMNISTON v1beta8 · STON.FI v2 DEX · OUTPUT_FIXED MODE
      </div>
    </div>
  );
};
