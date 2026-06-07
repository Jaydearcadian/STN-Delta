// src/components/DeltaDashboard.tsx
// Core gateway checkout card — 5-state lifecycle for EVM → TON invoice settlement

import { useState } from 'react';
import { Shield, ArrowRight, Lock, Zap, Copy, Check, Wallet, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import type { InvoiceState, AffiliateInvoiceState } from '../utils/codec';
import { useDeltaEngine } from '../hooks/useDeltaEngine';
import { TerminalLog } from './TerminalLog';
import { SuccessPanel } from './SuccessPanel';
import { CatchMascot } from './CatchMascot';

type Props = {
  invoice: InvoiceState | null;
  affiliateData: AffiliateInvoiceState | null;
};

const USER_BUFFER = 55.00;

export const DeltaDashboard = ({ invoice, affiliateData }: Props) => {
  const { address: evmAddress } = useAccount();
  const [sourceNetwork, setSourceNetwork] = useState('Base (USDC)');
  const engine = useDeltaEngine(invoice, affiliateData, evmAddress, sourceNetwork);
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
    <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
      {/* ─── CARD ─────────────────────────────────────────────────────────── */}
      <div className="card card-cyan-glow" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ─── HYDRATING ────────────────────────────────────────────────── */}
        {engine.state === 'HYDRATING' && (
          <div style={{ textAlign: 'center', padding: '36px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <CatchMascot state="processing" size={80} />
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              Initialising Omniston routes &amp; generating keypairs
              <span className="animate-blink" style={{ color: 'var(--accent)' }}>_</span>
            </div>
          </div>
        )}

        {/* ─── ROUTE_STREAM ─────────────────────────────────────────────── */}
        {engine.state === 'ROUTE_STREAM' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Invoice intent header */}
            <div>
              <span className="section-label">
                {affiliateData ? '🔗 Affiliate invoice' : 'Inbound invoice'}
              </span>
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                  color: 'var(--text-primary)',
                }}>
                  ${invoiceAmount.toFixed(2)}
                </span>
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}>
                  {activeInvoice.assetSymbol} on TON
                </span>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '8px',
              }}>
                {activeInvoice.id}
              </div>
            </div>

            {/* Affiliate ribbon */}
            {affiliateData && (
              <div className="banner banner-amber">
                <Zap size={13} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px' }}>
                  Referral link — <strong style={{ color: 'var(--warning)' }}>0.2% fee</strong> auto-paid to{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {affiliateData.affiliateAlias ?? affiliateData.affiliateWallet.slice(0, 12) + '...'}
                  </span>
                </span>
              </div>
            )}

            {/* Omniston metrics */}
            <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div className="metric-row" style={{ alignItems: 'center' }}>
                <span className="metric-label">You send</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="metric-value" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                    ${USER_BUFFER.toFixed(2)}
                  </span>
                  <select
                    value={sourceNetwork}
                    onChange={(e) => setSourceNetwork(e.target.value)}
                    className="input-field"
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      height: 'auto',
                      minHeight: '22px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      borderRadius: '4px',
                      outline: 'none',
                    }}
                  >
                    <option value="Base (USDC)">Base (USDC)</option>
                    <option value="Polygon (pUSD)">Polygon (pUSD)</option>
                    <option value="Ethereum (USD₮)">Ethereum (USD₮)</option>
                    <option value="BNB Chain (USD₮)">BNB Chain (USD₮)</option>
                  </select>
                </div>
              </div>
              <div className="metric-row">
                <span className="metric-label">Omniston input required</span>
                <span className="metric-value cyan">
                  {requiredInput > 0 ? `$${engine.metrics.requiredInputUsdc}` : '—'} {sourceNetwork.includes('USDC') ? 'USDC' : sourceNetwork.includes('pUSD') ? 'pUSD' : 'USD₮'}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Slippage bound</span>
                <span className="metric-value">{engine.metrics.slippageBps > 0 ? `${(engine.metrics.slippageBps / 100).toFixed(2)}%` : '—'}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Settlement method</span>
                <span className="metric-value" style={{ fontSize: '12px' }}>HTLC Atomic Swap</span>
              </div>
              <hr className="metric-divider" />
              <div className="metric-row">
                <span className="metric-label">Merchant receives</span>
                <span className="metric-value emerald" style={{ fontWeight: 700, fontSize: '14px' }}>
                  ${invoiceAmount.toFixed(2)} USDT ✓
                </span>
              </div>
              {engine.isGasless && (
                <div className="metric-row">
                  <span className="metric-label">Gas sponsor deduction</span>
                  <span className="metric-value amber">−${engine.metrics.gasSponsorDeduction} USDC</span>
                </div>
              )}
              <div className="metric-row" style={{ paddingTop: '6px' }}>
                <span className="metric-label" style={{ color: 'var(--accent)', fontWeight: 500 }}>Your residual captured</span>
                <span className="metric-value" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px' }}>
                  ${engine.metrics.residualGas}
                </span>
              </div>
            </div>

            {/* ─── RESIDUAL ROUTING CHOICE ─────────────────────────────── */}
            <div>
              <span className="section-label" style={{ marginBottom: '12px', display: 'inline-block' }}>
                Residual routing
              </span>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '6px',
                marginBottom: '12px',
              }}>
                ${engine.metrics.residualGas} remaining — choose where it goes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                {/* Option A: New TON Wallet */}
                <label
                  className={`toggle-row ${engine.residualRoute === 'TON_WALLET' ? 'active' : ''}`}
                  onClick={() => engine.setResidualRoute('TON_WALLET')}
                  style={{
                    cursor: 'pointer',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <div className={`toggle-checkbox ${engine.residualRoute === 'TON_WALLET' ? 'checked' : ''}`}>
                      {engine.residualRoute === 'TON_WALLET' && <Check size={10} color="var(--bg-primary)" />}
                    </div>
                    <Shield size={13} color={engine.residualRoute === 'TON_WALLET' ? 'var(--accent)' : 'var(--text-muted)'} />
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: engine.residualRoute === 'TON_WALLET' ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>
                      New TON Wallet
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    paddingLeft: '28px',
                  }}>
                    Generate wallet + seed with gas. Onboard to TON DeFi instantly.
                  </div>
                </label>

                {/* Option B: Return to EVM */}
                <label
                  className={`toggle-row ${engine.residualRoute === 'EVM_RETURN' ? 'active' : ''}`}
                  onClick={() => engine.setResidualRoute('EVM_RETURN')}
                  style={{
                    cursor: 'pointer',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <div className={`toggle-checkbox ${engine.residualRoute === 'EVM_RETURN' ? 'checked' : ''}`}>
                      {engine.residualRoute === 'EVM_RETURN' && <Check size={10} color="var(--bg-primary)" />}
                    </div>
                    <RefreshCw size={13} color={engine.residualRoute === 'EVM_RETURN' ? 'var(--accent)' : 'var(--text-muted)'} />
                    <span style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: engine.residualRoute === 'EVM_RETURN' ? 'var(--accent)' : 'var(--text-secondary)',
                    }}>
                      Return to EVM
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    paddingLeft: '28px',
                  }}>
                    Send USDC back to your connected wallet on Base.
                  </div>
                </label>
              </div>

              {/* Show relevant detail under selected option */}
              {engine.residualRoute === 'TON_WALLET' && engine.tonIdentity && (
                <div className="banner banner-cyan" style={{ marginTop: '10px' }}>
                  <Shield size={12} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                      fontWeight: 500,
                    }}>
                      New TON address
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="address-box" style={{ flex: 1 }}>{engine.tonIdentity.address}</div>
                      <button className={`copy-btn ${copiedAddr ? 'copied' : ''}`} onClick={copyAddress}>
                        {copiedAddr ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {engine.residualRoute === 'EVM_RETURN' && (
                <div className="banner banner-cyan" style={{ marginTop: '10px' }}>
                  <Wallet size={12} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginBottom: '3px',
                      fontWeight: 500,
                    }}>
                      Return to
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {evmAddress
                        ? <span style={{ color: 'var(--text-secondary)' }}>{evmAddress.slice(0, 14)}…{evmAddress.slice(-8)}</span>
                        : <span style={{ color: 'var(--warning)' }}>⚠ Connect your EVM wallet first</span>
                      }
                    </div>
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
                  {engine.isGasless && <Check size={10} color="var(--bg-primary)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    Gasless EVM Onboarding
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginTop: '3px',
                    lineHeight: 1.5,
                  }}>
                    Sponsor TON wallet deployment gas from $0.42 of your inbound USDC — no native TON needed
                  </div>
                </div>
                <Zap size={16} color={engine.isGasless ? 'var(--accent)' : 'var(--text-muted)'} />
              </label>
            </div>

            {/* Route hops */}
            {engine.metrics.routeHops.length > 0 && (
              <div>
                <span className="section-label" style={{ marginBottom: '10px', display: 'inline-block' }}>
                  Route path
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {engine.metrics.routeHops.map((hop, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className={`status-dot ${
                        i === 0 ? 'cyan' :
                        i === engine.metrics.routeHops.length - 1 ? 'emerald' : 'slate'
                      }`} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {hop}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal log */}
            <div>
              <span className="section-label" style={{ marginBottom: '10px', display: 'inline-block' }}>
                Omniston stream
              </span>
              <div style={{ marginTop: '8px' }}>
                <TerminalLog logs={engine.log} />
              </div>
            </div>

            {/* Authorize CTA */}
            <button
              id="authorize-payment-btn"
              className="btn btn-primary btn-full"
              onClick={engine.executePayment}
              disabled={engine.metrics.quoteId === ''}
              style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 600 }}
            >
              <Lock size={15} />
              Authorize Swap &amp; Bridge
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ─── LOCKING_EVM + SWAP_SETTLING ──────────────────────────────── */}
        {(engine.state === 'LOCKING_EVM' || engine.state === 'SWAP_SETTLING') && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center', paddingTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <CatchMascot state={engine.state === 'LOCKING_EVM' ? 'processing' : 'capturing'} size={80} />
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                {engine.state === 'LOCKING_EVM' ? 'Awaiting EVM Signature' : 'Routing via Omniston'}
              </div>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginTop: '6px',
              }}>
                {engine.state === 'LOCKING_EVM'
                  ? 'Confirm transaction in your EVM wallet...'
                  : 'HTLC resolvers finalising settlement on TON...'}
              </div>
            </div>

            {/* Progress */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                <span>EVM Lock</span>
                <span>HTLC Relay</span>
                <span>TON Settle</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            {/* Live log */}
            <div>
              <span className="section-label" style={{ marginBottom: '10px', display: 'inline-block' }}>
                Settlement log
              </span>
              <div style={{ marginTop: '8px' }}>
                <TerminalLog logs={engine.log} />
              </div>
            </div>
          </div>
        )}

        {/* ─── SUCCESS_VALEDICTORY ───────────────────────────────────────── */}
        {engine.state === 'SUCCESS_VALEDICTORY' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Residual outcome notice */}
            {engine.residualRoute === 'EVM_RETURN' ? (
              <div className="banner banner-emerald">
                <RefreshCw size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--success)',
                    marginBottom: '4px',
                  }}>
                    Residual returned to EVM
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>${engine.metrics.residualGas} USDC</span> returned to{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '12px' }}>
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
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: 'var(--warning)',
                  fontWeight: 700,
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>⚠</span> Save your TON wallet recovery phrase
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
              <div className="banner banner-amber">
                <Zap size={13} color="var(--warning)" style={{ marginTop: '2px' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px' }}>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>${engine.affiliateCommissionUsdt} USDC</strong> (0.2% of swap) automatically transferred to referrer's wallet
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── CARD FOOTER ───────────────────────────────────────────────────── */}
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        color: 'var(--text-disabled)',
        textAlign: 'center',
        marginTop: '16px',
        letterSpacing: '0.02em',
        fontWeight: 400,
      }}>
        Powered by Omniston v1beta8 · STON.fi v2 DEX · Output Fixed Mode
      </div>
    </div>
  );
};
