// src/pages/MerchantPage.tsx
// Merchant invoice generator — Solo mode, Group Split (adjustable per-payer), Affiliate

import { useState, useCallback } from 'react';
import { Link2, Users, Copy, Check, Share2, ArrowRight, Zap, Plus, Minus, RefreshCw } from 'lucide-react';
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

  const hasOutput = generatedLink || generatedPayers.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="page-wide" style={{ maxWidth: 820 }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <span className="section-label">MERCHANT GENERATOR</span>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '10px', lineHeight: 1.2 }}>
          Create a Payment Request
        </h1>
        <p style={{ color: 'var(--color-slate-400)', fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
          Generate a cryptographic, URL-encoded invoice. No server required — payment state lives entirely in the link.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: hasOutput ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>

        {/* ─── FORM ─────────────────────────────────────────────────────────── */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Mode toggle */}
          <div>
            <div className="input-label" style={{ marginBottom: '8px' }}>PAYMENT MODE</div>
            <div className="tab-bar">
              <button
                className={`tab-item ${mode === 'SOLO' ? 'active' : ''}`}
                onClick={() => setMode('SOLO')}
              >
                <Link2 size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Solo
              </button>
              <button
                className={`tab-item ${mode === 'GROUP' ? 'active' : ''}`}
                onClick={() => { setMode('GROUP'); if (payers.length === 0) setPayers(makePayers(DEFAULT_PAYER_COUNT, amount)); }}
              >
                <Users size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Group Split
              </button>
            </div>
          </div>

          {/* Merchant address */}
          <div>
            <label className="input-label">MERCHANT TON WALLET</label>
            <input
              id="merchant-address"
              className={`input-field ${errors.merchant ? 'error' : ''}`}
              placeholder="EQA... or UQA..."
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
            />
            {errors.merchant && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-red)', marginTop: '4px' }}>
                {errors.merchant}
              </div>
            )}
          </div>

          {/* Total amount + asset (solo always, group shows as reference) */}
          <div>
            <label className="input-label">
              {mode === 'GROUP' ? 'TOTAL INVOICE AMOUNT (reference)' : 'INVOICE AMOUNT'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="invoice-amount"
                className={`input-field ${errors.amount ? 'error' : ''}`}
                placeholder="50.00"
                value={amount}
                onChange={e => {
                  setAmount(e.target.value);
                  // Don't auto-update payer amounts — user controls them manually
                }}
                style={{ flex: 1 }}
                type="number"
                min="0"
                step="0.01"
              />
              <select
                className="input-field"
                style={{ width: 90, flexShrink: 0 }}
                value={assetIdx}
                onChange={e => setAssetIdx(Number(e.target.value))}
              >
                {SUPPORTED_ASSETS.map((a, i) => (
                  <option key={a.symbol} value={i}>{a.symbol}</option>
                ))}
              </select>
            </div>
            {errors.amount && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-red)', marginTop: '4px' }}>
                {errors.amount}
              </div>
            )}
          </div>

          {/* ─── GROUP SPLIT PAYER EDITOR ──────────────────────────────────── */}
          {mode === 'GROUP' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="input-label" style={{ margin: 0 }}>
                  PAYERS ({payers.length})
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '9px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={splitEvenly}
                    title="Split total evenly"
                  >
                    <RefreshCw size={10} />
                    SPLIT EVENLY
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '9px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={addPayer}
                    disabled={payers.length >= 10}
                  >
                    <Plus size={10} />
                    ADD
                  </button>
                </div>
              </div>

              {/* Per-payer rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {payers.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Label input */}
                    <input
                      className="input-field"
                      style={{ width: '110px', flexShrink: 0, fontSize: '11px', padding: '6px 10px' }}
                      value={p.label}
                      onChange={e => updatePayerLabel(i, e.target.value)}
                      placeholder={`Payer ${i + 1}`}
                    />
                    {/* Amount input */}
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--color-slate-500)',
                        pointerEvents: 'none',
                      }}>$</span>
                      <input
                        id={`payer-amount-${i}`}
                        className="input-field"
                        style={{ paddingLeft: '22px', fontSize: '12px', fontWeight: 600, width: '100%' }}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={p.amount}
                        onChange={e => updatePayerAmount(i, e.target.value)}
                      />
                    </div>
                    {/* Asset label */}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)', flexShrink: 0 }}>
                      {asset.symbol}
                    </span>
                    {/* Remove */}
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '6px 8px', flexShrink: 0, color: payers.length <= 2 ? 'var(--color-slate-700)' : 'var(--color-red)' }}
                      onClick={() => removePayer(i)}
                      disabled={payers.length <= 2}
                      title="Remove payer"
                    >
                      <Minus size={11} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Balance indicator */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                background: isBalanced
                  ? 'rgba(16,185,129,0.06)'
                  : invoiceTotal > 0
                    ? 'rgba(245,158,11,0.06)'
                    : 'var(--color-bg)',
                border: `1px solid ${isBalanced ? 'rgba(16,185,129,0.2)' : invoiceTotal > 0 ? 'rgba(245,158,11,0.2)' : 'var(--color-border)'}`,
                borderRadius: '8px',
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                  <div style={{ color: 'var(--color-slate-500)', marginBottom: '2px' }}>PAYER TOTAL</div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: isBalanced
                      ? 'var(--color-emerald)'
                      : invoiceTotal > 0
                        ? 'var(--color-amber)'
                        : 'var(--color-slate-400)',
                  }}>
                    ${payerTotal.toFixed(2)} {asset.symbol}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                  <div style={{ color: 'var(--color-slate-500)', marginBottom: '2px' }}>INVOICE TOTAL</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-slate-300)' }}>
                    ${invoiceTotal > 0 ? invoiceTotal.toFixed(2) : '—'} {invoiceTotal > 0 ? asset.symbol : ''}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700 }}>
                  {isBalanced ? (
                    <span style={{ color: 'var(--color-emerald)' }}>✓ Balanced</span>
                  ) : invoiceTotal > 0 && payerTotal > 0 ? (
                    <span style={{ color: 'var(--color-amber)' }}>
                      {payerTotal > invoiceTotal ? '+' : '-'}${balanceDiff.toFixed(2)} off
                    </span>
                  ) : null}
                </div>
              </div>

              {errors.payers && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-red)' }}>
                  {errors.payers}
                </div>
              )}

              <div className="banner banner-cyan" style={{ padding: '10px 12px', fontSize: '11px' }}>
                <Users size={12} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
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
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
                  Generate Affiliate Variant
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                  0.2% of the swap amount paid automatically to referrer's wallet
                </div>
              </div>
              <Zap size={14} color={showAffiliate ? 'var(--color-cyan)' : 'var(--color-slate-600)'} />
            </label>

            {showAffiliate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <div>
                  <label className="input-label">AFFILIATE TON WALLET</label>
                  <input
                    id="affiliate-wallet"
                    className={`input-field ${errors.affiliateWallet ? 'error' : ''}`}
                    placeholder="EQA... (referrer's wallet)"
                    value={affiliateWallet}
                    onChange={e => setAffiliateWallet(e.target.value)}
                  />
                  {errors.affiliateWallet && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-red)', marginTop: '4px' }}>
                      {errors.affiliateWallet}
                    </div>
                  )}
                </div>
                <div>
                  <label className="input-label">AFFILIATE ALIAS (optional)</label>
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
          >
            {mode === 'GROUP' ? <Users size={13} /> : <Link2 size={13} />}
            GENERATE {mode === 'GROUP' ? 'GROUP SPLIT' : 'INVOICE'} LINK{mode === 'GROUP' ? 'S' : ''}
            <ArrowRight size={13} />
          </button>
        </div>

        {/* ─── OUTPUT COLUMN ────────────────────────────────────────────────── */}
        {hasOutput && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Solo link */}
            {generatedLink && (
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="section-label">INVOICE LINK</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)' }}>
                    ${amount} {asset.symbol}
                  </span>
                </div>
                <div className="address-box" style={{ fontSize: '9px', wordBreak: 'break-all' }}>
                  {generatedLink}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn btn-ghost ${copied['main'] ? 'btn-emerald' : ''}`}
                    style={{ flex: 1, fontSize: '10px' }}
                    onClick={() => copyLink('main', generatedLink)}
                  >
                    {copied['main'] ? <Check size={12} /> : <Copy size={12} />}
                    {copied['main'] ? 'COPIED' : 'COPY LINK'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, fontSize: '10px' }}
                    onClick={() => telegramShare(generatedLink, `Pay ${amount} ${asset.symbol}`)}
                  >
                    <Share2 size={12} />
                    TELEGRAM
                  </button>
                </div>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-emerald btn-full"
                  style={{ fontSize: '10px' }}
                >
                  PREVIEW GATEWAY →
                </a>
              </div>
            )}

            {/* Affiliate link */}
            {affiliateLink && (
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', borderColor: 'rgba(245,158,11,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="section-label amber">AFFILIATE LINK</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber)' }}>0.2% fee</span>
                </div>
                <div className="banner banner-amber" style={{ padding: '8px 10px', fontSize: '11px' }}>
                  <Zap size={11} color="var(--color-amber)" />
                  <span>Referrer earns 0.2% of every swap routed through this link</span>
                </div>
                <div className="address-box" style={{ fontSize: '9px', wordBreak: 'break-all', borderColor: 'rgba(245,158,11,0.15)' }}>
                  {affiliateLink}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn btn-ghost ${copied['aff'] ? 'btn-emerald' : ''}`}
                    style={{ flex: 1, fontSize: '10px' }}
                    onClick={() => copyLink('aff', affiliateLink)}
                  >
                    {copied['aff'] ? <Check size={12} /> : <Copy size={12} />}
                    {copied['aff'] ? 'COPIED' : 'COPY'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, fontSize: '10px' }}
                    onClick={() => telegramShare(affiliateLink, `💰 Earn 0.2% commission on this payment`)}
                  >
                    <Share2 size={12} />
                    SHARE
                  </button>
                </div>
              </div>
            )}

            {/* Group payer links */}
            {generatedPayers.length > 0 && (
              <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="section-label">GROUP SPLIT LINKS</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-400)' }}>
                    {generatedPayers.length} payers · ${invoiceTotal.toFixed(2)} total
                  </span>
                </div>

                <div className="banner banner-cyan" style={{ fontSize: '11px' }}>
                  <Users size={12} color="var(--color-cyan)" />
                  <span>Each link is unique to that payer's amount. Send each person their own link.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {generatedPayers.map((payer, i) => (
                    <div key={i} className="payer-slot">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
                          {payer.label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--color-cyan)' }}>
                          ${payer.amount} <span style={{ fontSize: '10px', color: 'var(--color-slate-500)', fontWeight: 400 }}>{asset.symbol}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <div className="address-box" style={{ flex: 1, fontSize: '8px', padding: '5px 8px', wordBreak: 'break-all' }}>
                          {payer.link.slice(0, 60)}…
                        </div>
                        <button
                          className={`copy-btn ${copied[`p${i}`] ? 'copied' : ''}`}
                          onClick={() => copyLink(`p${i}`, payer.link)}
                          style={{ flexShrink: 0 }}
                        >
                          {copied[`p${i}`] ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                        <button
                          className="copy-btn"
                          onClick={() => telegramShare(payer.link, `Your share: $${payer.amount} ${asset.symbol}`)}
                          style={{ flexShrink: 0 }}
                          title="Share on Telegram"
                        >
                          <Share2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Copy all */}
                <button
                  className="btn btn-ghost btn-full"
                  style={{ fontSize: '10px' }}
                  onClick={() => {
                    const all = generatedPayers.map(p => `${p.label} ($${p.amount} ${asset.symbol}): ${p.link}`).join('\n\n');
                    navigator.clipboard.writeText(all);
                    copyLink('all', all);
                  }}
                >
                  {copied['all'] ? <Check size={12} /> : <Copy size={12} />}
                  {copied['all'] ? 'ALL LINKS COPIED' : 'COPY ALL LINKS'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
