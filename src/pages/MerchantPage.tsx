// src/pages/MerchantPage.tsx
// Merchant invoice generator — Solo mode, Group Split (adjustable per-payer), Affiliate

import { useState, useCallback } from 'react';
import { Link2, Users, Copy, Check, Share2, ArrowRight, Zap, Plus, Minus, RefreshCw, ExternalLink } from 'lucide-react';
import {
  InvoiceCodec,
  AffiliateCodec,
  generateInvoiceId,
} from '../utils/codec';
import type { InvoiceState, AffiliateInvoiceState } from '../utils/codec';

// Supported TON jetton addresses
const SUPPORTED_ASSETS = [
  { symbol: 'USDT', address: 'EQCxE6mUoGEyB7j9meA_3O9CgjWb8A1mYb9bA1b7Doo2Tok', decimals: 6 },
  { symbol: 'USDC', address: 'EQBf8PYj4K9mYA8ZvdH_k3eA7jWb8A1mYb9bA1b7Doo2Ptr', decimals: 6 },
  { symbol: 'TON',  address: 'NATIVE',                                              decimals: 9 },
];

type Mode = 'SOLO' | 'GROUP';

type PayerSlot = {
  label: string;   // e.g. "Payer 1"
  amount: string;  // individual editable amount
};

type GeneratedPayer = {
  label: string;
  amount: string;
  link: string;
};

const DEFAULT_PAYER_COUNT = 3;

const makePayers = (count: number, totalStr: string): PayerSlot[] => {
  const total = parseFloat(totalStr) || 0;
  const perPayer = total > 0 ? (total / count).toFixed(2) : '';
  return Array.from({ length: count }, (_, i) => ({
    label: `Payer ${i + 1}`,
    amount: perPayer,
  }));
};

export const MerchantPage = () => {
  const [mode, setMode]         = useState<Mode>('SOLO');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount]     = useState('');
  const [assetIdx, setAssetIdx] = useState(0);

  // Group split state
  const [payers, setPayers] = useState<PayerSlot[]>(() => makePayers(DEFAULT_PAYER_COUNT, ''));

  // Affiliate state
  const [showAffiliate, setShowAffiliate]     = useState(false);
  const [affiliateWallet, setAffiliateWallet] = useState('');
  const [affiliateAlias, setAffiliateAlias]   = useState('');

  // Output state
  const [generatedLink, setGeneratedLink]       = useState('');
  const [affiliateLink, setAffiliateLink]       = useState('');
  const [generatedPayers, setGeneratedPayers]   = useState<GeneratedPayer[]>([]);
  const [copied, setCopied]                     = useState<Record<string, boolean>>({});
  const [errors, setErrors]                     = useState<Record<string, string>>({});

  // Direct invoice input state
  const [directInvoice, setDirectInvoice] = useState('');

  const asset = SUPPORTED_ASSETS[assetIdx];

  // ─── Payer slot helpers ──────────────────────────────────────────────────

  const addPayer = () => {
    setPayers(prev => [...prev, { label: `Payer ${prev.length + 1}`, amount: '' }]);
  };

  const removePayer = (i: number) => {
    setPayers(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      // Re-label sequentially
      return next.map((p, idx) => ({ ...p, label: `Payer ${idx + 1}` }));
    });
  };

  const updatePayerAmount = (i: number, val: string) => {
    setPayers(prev => prev.map((p, idx) => idx === i ? { ...p, amount: val } : p));
  };

  const updatePayerLabel = (i: number, val: string) => {
    setPayers(prev => prev.map((p, idx) => idx === i ? { ...p, label: val } : p));
  };

  // Split total evenly across all payers
  const splitEvenly = () => {
    const total = parseFloat(amount) || 0;
    if (total <= 0 || payers.length === 0) return;
    const per = (total / payers.length).toFixed(2);
    setPayers(prev => prev.map(p => ({ ...p, amount: per })));
  };

  const payerTotal = payers.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const invoiceTotal = parseFloat(amount) || 0;
  const balanceDiff = Math.abs(payerTotal - invoiceTotal);
  const isBalanced = invoiceTotal > 0 && balanceDiff < 0.01;

  // ─── Validation ──────────────────────────────────────────────────────────

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};

    if (!merchant.startsWith('EQ') && !merchant.startsWith('UQ')) {
      errs.merchant = 'Must be a valid TON address (EQ... or UQ...)';
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      errs.amount = 'Enter a valid amount greater than 0';
    }
    if (mode === 'GROUP') {
      if (payers.length < 2) {
        errs.payers = 'Group split requires at least 2 payers';
      }
      const anyEmpty = payers.some(p => !p.amount || parseFloat(p.amount) <= 0);
      if (anyEmpty) {
        errs.payers = 'All payers must have an amount greater than 0';
      }
      if (!isNaN(amt) && amt > 0 && balanceDiff >= 0.01) {
        errs.payers = `Payer amounts sum to $${payerTotal.toFixed(2)} but invoice total is $${amt.toFixed(2)} — they must match`;
      }
    }
    if (showAffiliate && affiliateWallet && !affiliateWallet.startsWith('EQ') && !affiliateWallet.startsWith('UQ')) {
      errs.affiliateWallet = 'Must be a valid TON address';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [merchant, amount, mode, payers, isBalanced, balanceDiff, payerTotal, showAffiliate, affiliateWallet]);

  // ─── Generate ────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (!validate()) return;

    const id = generateInvoiceId();

    if (mode === 'SOLO') {
      const state: InvoiceState = {
        merchant,
        amount,
        asset: asset.address,
        assetSymbol: asset.symbol,
        id,
        mode: 'SOLO',
      };
      setGeneratedLink(InvoiceCodec.encode(state));
      setGeneratedPayers([]);

      if (showAffiliate && affiliateWallet) {
        const affState: AffiliateInvoiceState = {
          ...state,
          affiliateWallet,
          affiliateAlias: affiliateAlias || undefined,
          referrerFeePct: 0.2,
        };
        setAffiliateLink(AffiliateCodec.encode(affState));
      } else {
        setAffiliateLink('');
      }
    } else {
      // GROUP — each payer has their own custom amount
      const generated: GeneratedPayer[] = payers.map((p, i) => {
        const payerState: InvoiceState = {
          merchant,
          amount: parseFloat(p.amount).toFixed(2),
          asset: asset.address,
          assetSymbol: asset.symbol,
          id: `${id}-P${i + 1}`,
          mode: 'GROUP',
          groupSize: payers.length,
          payerIndex: i,
        };
        return {
          label: p.label,
          amount: parseFloat(p.amount).toFixed(2),
          link: InvoiceCodec.encode(payerState),
        };
      });

      setGeneratedPayers(generated);
      setGeneratedLink('');
      setAffiliateLink('');
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const copyLink = (key: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  };

  const telegramShare = (link: string, label: string) => {
    const text = encodeURIComponent(`🔗 ${label}\n\n${link}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`, '_blank');
  };

  const handleDirectInvoice = () => {
    if (!directInvoice.trim()) return;
    const invoiceParam = encodeURIComponent(directInvoice.trim());
    window.location.href = `/gateway?invoice=${invoiceParam}`;
  };

  const hasOutput = generatedLink || generatedPayers.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-wide" style={{ maxWidth: 860 }}>

      {/* ─── HERO SECTION ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1
          className="text-gradient-cyan"
          style={{
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          Zero Waste. Full Yield.
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 16,
          lineHeight: 1.6,
          maxWidth: 480,
          margin: '0 auto',
        }}>
          The cross-chain payment gateway that captures every dollar.
        </p>
      </div>

      {/* ─── DIRECT INVOICE INPUT ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span className="section-label">Direct invoice</span>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            Already have a link? Paste it below.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input-field mono"
            placeholder="Paste invoice link or encoded payload…"
            value={directInvoice}
            onChange={e => setDirectInvoice(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleDirectInvoice(); }}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleDirectInvoice}
            disabled={!directInvoice.trim()}
            style={{ flexShrink: 0 }}
          >
            <ExternalLink size={14} />
            Open gateway
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT GRID ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: hasOutput ? '1fr 1fr' : '1fr',
        gap: 24,
        alignItems: 'start',
      }}>

        {/* ─── FORM CARD ───────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ marginBottom: 4 }}>
            <span className="section-label">Create invoice</span>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--text-muted)',
              marginTop: 10,
              lineHeight: 1.5,
            }}>
              Generate a cryptographic, URL-encoded invoice. No server required — payment state lives entirely in the link.
            </p>
          </div>

          {/* Mode toggle */}
          <div>
            <label className="input-label">Payment mode</label>
            <div className="tab-bar">
              <button
                className={`tab-item ${mode === 'SOLO' ? 'active' : ''}`}
                onClick={() => setMode('SOLO')}
              >
                <Link2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                Solo
              </button>
              <button
                className={`tab-item ${mode === 'GROUP' ? 'active' : ''}`}
                onClick={() => { setMode('GROUP'); if (payers.length === 0) setPayers(makePayers(DEFAULT_PAYER_COUNT, amount)); }}
              >
                <Users size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />
                Group split
              </button>
            </div>
          </div>

          {/* Merchant address */}
          <div>
            <label className="input-label">Merchant TON wallet</label>
            <input
              id="merchant-address"
              className={`input-field mono ${errors.merchant ? 'error' : ''}`}
              placeholder="EQA... or UQA..."
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
            />
            {errors.merchant && (
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: 'var(--error)',
                marginTop: 6,
              }}>
                {errors.merchant}
              </div>
            )}
          </div>

          {/* Total amount + asset (solo always, group shows as reference) */}
          <div>
            <label className="input-label">
              {mode === 'GROUP' ? 'Total invoice amount (reference)' : 'Invoice amount'}
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                id="invoice-amount"
                className={`input-field ${errors.amount ? 'error' : ''}`}
                placeholder="50.00"
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  // Don't auto-update payer amounts — user controls them manually
                }}
                style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                type="number"
                min="0"
                step="0.01"
              />
              <select
                className="input-field"
                style={{ width: 100, flexShrink: 0, fontFamily: 'var(--font-mono)' }}
                value={assetIdx}
                onChange={e => setAssetIdx(Number(e.target.value))}
              >
                {SUPPORTED_ASSETS.map((a, i) => (
                  <option key={a.symbol} value={i}>{a.symbol}</option>
                ))}
              </select>
            </div>
            {errors.amount && (
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: 'var(--error)',
                marginTop: 6,
              }}>
                {errors.amount}
              </div>
            )}
          </div>

          {/* ─── GROUP SPLIT PAYER EDITOR ──────────────────────────────────── */}
          {mode === 'GROUP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="input-label" style={{ margin: 0 }}>
                  Payers ({payers.length})
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                    onClick={splitEvenly}
                    title="Split total evenly"
                  >
                    <RefreshCw size={11} />
                    Split evenly
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                    onClick={addPayer}
                    disabled={payers.length >= 10}
                  >
                    <Plus size={11} />
                    Add
                  </button>
                </div>
              </div>

              {/* Per-payer rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {payers.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {/* Label input */}
                    <input
                      className="input-field"
                      style={{ width: 120, flexShrink: 0, fontSize: 12, padding: '8px 12px' }}
                      value={p.label}
                      onChange={e => updatePayerLabel(i, e.target.value)}
                      placeholder={`Payer ${i + 1}`}
                    />
                    {/* Amount input */}
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        pointerEvents: 'none',
                      }}>$</span>
                      <input
                        id={`payer-amount-${i}`}
                        className="input-field"
                        style={{ paddingLeft: 24, fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, width: '100%' }}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={p.amount}
                        onChange={e => updatePayerAmount(i, e.target.value)}
                      />
                    </div>
                    {/* Asset label */}
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}>
                      {asset.symbol}
                    </span>
                    {/* Remove */}
                    <button
                      className="btn btn-ghost"
                      style={{
                        padding: '7px 9px',
                        flexShrink: 0,
                        color: payers.length <= 2 ? 'var(--text-disabled)' : 'var(--error)',
                      }}
                      onClick={() => removePayer(i)}
                      disabled={payers.length <= 2}
                      title="Remove payer"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Balance indicator */}
              <div className="card-inner" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                background: isBalanced
                  ? 'rgba(16,185,129,0.06)'
                  : invoiceTotal > 0
                    ? 'rgba(245,158,11,0.06)'
                    : 'var(--bg-primary)',
                borderColor: isBalanced
                  ? 'rgba(16,185,129,0.2)'
                  : invoiceTotal > 0
                    ? 'rgba(245,158,11,0.2)'
                    : 'var(--border-subtle)',
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 3,
                    fontWeight: 500,
                  }}>Payer total</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: isBalanced
                      ? 'var(--success)'
                      : invoiceTotal > 0
                        ? 'var(--warning)'
                        : 'var(--text-secondary)',
                  }}>
                    ${payerTotal.toFixed(2)} {asset.symbol}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 3,
                    fontWeight: 500,
                  }}>Invoice total</div>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}>
                    ${invoiceTotal > 0 ? invoiceTotal.toFixed(2) : '—'} {invoiceTotal > 0 ? asset.symbol : ''}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
                  {isBalanced ? (
                    <span style={{ color: 'var(--success)' }}>✓ Balanced</span>
                  ) : invoiceTotal > 0 && payerTotal > 0 ? (
                    <span style={{ color: 'var(--warning)' }}>
                      {payerTotal > invoiceTotal ? '+' : '-'}${balanceDiff.toFixed(2)} off
                    </span>
                  ) : null}
                </div>
              </div>

              {errors.payers && (
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: 'var(--error)',
                }}>
                  {errors.payers}
                </div>
              )}

              <div className="banner banner-cyan" style={{ padding: '12px 14px', fontSize: 12 }}>
                <Users size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Each payer gets a unique checkout link with their individual amount. Their residual seeds their own new TON wallet.
                </span>
              </div>
            </div>
          )}

          {/* ─── AFFILIATE TOGGLE ──────────────────────────────────────────── */}
          <div>
            <label
              className={`toggle-row ${showAffiliate ? 'active' : ''}`}
              onClick={() => setShowAffiliate(p => !p)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`toggle-checkbox ${showAffiliate ? 'checked' : ''}`}>
                {showAffiliate && <Check size={10} color="#020617" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  Generate affiliate variant
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 3,
                }}>
                  0.2% of the swap amount paid automatically to referrer's wallet
                </div>
              </div>
              <Zap size={16} color={showAffiliate ? 'var(--accent)' : 'var(--text-disabled)'} />
            </label>

            {showAffiliate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                <div>
                  <label className="input-label">Affiliate TON wallet</label>
                  <input
                    id="affiliate-wallet"
                    className={`input-field mono ${errors.affiliateWallet ? 'error' : ''}`}
                    placeholder="EQA... (referrer's wallet)"
                    value={affiliateWallet}
                    onChange={e => setAffiliateWallet(e.target.value)}
                  />
                  {errors.affiliateWallet && (
                    <div style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      color: 'var(--error)',
                      marginTop: 6,
                    }}>
                      {errors.affiliateWallet}
                    </div>
                  )}
                </div>
                <div>
                  <label className="input-label">Affiliate alias (optional)</label>
                  <input
                    id="affiliate-alias"
                    className="input-field"
                    placeholder="@username or display name"
                    value={affiliateAlias}
                    onChange={e => setAffiliateAlias(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            id="generate-invoice-btn"
            className="btn btn-primary btn-full"
            onClick={handleGenerate}
            style={{ padding: '14px 24px', fontSize: 14, marginTop: 4 }}
          >
            {mode === 'GROUP' ? <Users size={15} /> : <Link2 size={15} />}
            Generate {mode === 'GROUP' ? 'group split' : 'gateway'} link{mode === 'GROUP' ? 's' : ''}
            <ArrowRight size={15} />
          </button>
        </div>

        {/* ─── OUTPUT COLUMN ────────────────────────────────────────────────── */}
        {hasOutput && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Solo link */}
            {generatedLink && (
              <div className="card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="section-label">Invoice link</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                  }}>
                    ${amount} {asset.symbol}
                  </span>
                </div>
                <div className="card-inner" style={{ padding: '14px 16px' }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    wordBreak: 'break-all',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    userSelect: 'all',
                  }}>
                    {generatedLink}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className={`btn btn-ghost ${copied['main'] ? 'btn-emerald' : ''}`}
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={() => copyLink('main', generatedLink)}
                  >
                    {copied['main'] ? <Check size={13} /> : <Copy size={13} />}
                    {copied['main'] ? 'Copied' : 'Copy link'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={() => telegramShare(generatedLink, `Pay ${amount} ${asset.symbol}`)}
                  >
                    <Share2 size={13} />
                    Telegram
                  </button>
                </div>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-emerald btn-full"
                  style={{ fontSize: 12 }}
                >
                  Preview gateway →
                </a>
              </div>
            )}

            {/* Affiliate link */}
            {affiliateLink && (
              <div className="card animate-fade-in" style={{
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                borderColor: 'rgba(245,158,11,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="section-label amber">Affiliate link</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--warning)',
                    fontWeight: 500,
                  }}>0.2% fee</span>
                </div>
                <div className="banner banner-amber" style={{ padding: '10px 12px', fontSize: 12 }}>
                  <Zap size={13} color="var(--warning)" />
                  <span>Referrer earns 0.2% of every swap routed through this link</span>
                </div>
                <div className="card-inner" style={{
                  padding: '14px 16px',
                  borderColor: 'rgba(245,158,11,0.15)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    wordBreak: 'break-all',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    userSelect: 'all',
                  }}>
                    {affiliateLink}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className={`btn btn-ghost ${copied['aff'] ? 'btn-emerald' : ''}`}
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={() => copyLink('aff', affiliateLink)}
                  >
                    {copied['aff'] ? <Check size={13} /> : <Copy size={13} />}
                    {copied['aff'] ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={() => telegramShare(affiliateLink, `💰 Earn 0.2% commission on this payment`)}
                  >
                    <Share2 size={13} />
                    Share
                  </button>
                </div>
              </div>
            )}

            {/* Group payer links */}
            {generatedPayers.length > 0 && (
              <div className="card animate-fade-in" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="section-label">Group split links</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}>
                    {generatedPayers.length} payers · ${invoiceTotal.toFixed(2)} total
                  </span>
                </div>

                <div className="banner banner-cyan" style={{ fontSize: 12, padding: '12px 14px' }}>
                  <Users size={14} color="var(--accent)" />
                  <span>Each link is unique to that payer's amount. Send each person their own link.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {generatedPayers.map((payer, i) => (
                    <div key={i} className="payer-slot">
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}>
                          {payer.label}
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 16,
                          fontWeight: 700,
                          color: 'var(--accent)',
                        }}>
                          ${payer.amount}{' '}
                          <span style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            fontWeight: 400,
                          }}>
                            {asset.symbol}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className="address-box" style={{
                          flex: 1,
                          fontSize: 9,
                          padding: '8px 10px',
                          wordBreak: 'break-all',
                        }}>
                          {payer.link.slice(0, 60)}…
                        </div>
                        <button
                          className={`copy-btn ${copied[`p${i}`] ? 'copied' : ''}`}
                          onClick={() => copyLink(`p${i}`, payer.link)}
                          style={{ flexShrink: 0 }}
                        >
                          {copied[`p${i}`] ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                        <button
                          className="copy-btn"
                          onClick={() => telegramShare(payer.link, `Your share: $${payer.amount} ${asset.symbol}`)}
                          style={{ flexShrink: 0 }}
                          title="Share on Telegram"
                        >
                          <Share2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Copy all */}
                <button
                  className="btn btn-ghost btn-full"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    const all = generatedPayers.map(p => `${p.label} ($${p.amount} ${asset.symbol}): ${p.link}`).join('\n\n');
                    navigator.clipboard.writeText(all);
                    copyLink('all', all);
                  }}
                >
                  {copied['all'] ? <Check size={13} /> : <Copy size={13} />}
                  {copied['all'] ? 'All links copied' : 'Copy all links'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
