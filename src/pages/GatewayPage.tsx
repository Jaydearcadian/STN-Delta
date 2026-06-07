// src/pages/GatewayPage.tsx
// Payer-facing gateway — paste-to-load input + URL param checkout

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Link2, ArrowRight, X, FileText } from 'lucide-react';
import { parseGatewayUrl, InvoiceCodec, AffiliateCodec } from '../utils/codec';
import type { InvoiceState, AffiliateInvoiceState } from '../utils/codec';
import { DeltaDashboard } from '../components/DeltaDashboard';
import { CatchMascot } from '../components/CatchMascot';

// Demo invoice shown before user loads a real one
const DEMO_INVOICE: InvoiceState = {
  merchant: 'EQAmerchantDemoAddressForHackathonDemonstration12345678',
  amount: '50.00',
  asset: 'EQCxE6mUoGEyB7j9meA_3O9CgjWb8A1mYb9bA1b7Doo2Tok',
  assetSymbol: 'USDT',
  id: 'INV-DEMO-2026',
  mode: 'SOLO',
};

// Try to extract invoice/affiliate data from a raw pasted string
// Accepts: full URL, just the ?inv= path, or bare encoded payload
const parseRawInput = (raw: string): {
  invoice: InvoiceState | null;
  affiliateData: AffiliateInvoiceState | null;
  error: string | null;
} => {
  const trimmed = raw.trim();
  if (!trimmed) return { invoice: null, affiliateData: null, error: null };

  try {
    // Try extracting from a full URL or path with query string
    let invParam: string | null = null;
    let affParam: string | null = null;

    if (trimmed.includes('?') || trimmed.includes('inv=') || trimmed.includes('aff=')) {
      // Parse as URL (add a fake base if it's just a path)
      const url = new URL(
        trimmed.startsWith('http') ? trimmed : `https://placeholder.com${trimmed.startsWith('/') ? trimmed : '/' + trimmed}`
      );
      invParam = url.searchParams.get('inv');
      affParam = url.searchParams.get('aff');
    } else {
      // Bare payload — try as inv first, then aff
      invParam = trimmed;
    }

    if (affParam) {
      const data = AffiliateCodec.decode(affParam);
      if (data) return { invoice: data, affiliateData: data, error: null };
      return { invoice: null, affiliateData: null, error: 'Could not decode affiliate payload — link may be corrupted.' };
    }

    if (invParam) {
      const data = InvoiceCodec.decode(invParam);
      if (data) return { invoice: data, affiliateData: null, error: null };
      return { invoice: null, affiliateData: null, error: 'Could not decode invoice payload — link may be corrupted.' };
    }

    return { invoice: null, affiliateData: null, error: 'No invoice or affiliate data found in this link.' };
  } catch {
    return { invoice: null, affiliateData: null, error: 'Invalid input — paste a full invoice link or encoded payload.' };
  }
};

export const GatewayPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Paste-to-load state
  const [pasteInput, setPasteInput] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [manualInvoice, setManualInvoice] = useState<InvoiceState | null>(null);
  const [manualAffiliate, setManualAffiliate] = useState<AffiliateInvoiceState | null>(null);

  // From URL params (shared link flow)
  const { type, data } = parseGatewayUrl(params);
  const hasUrlParams = !!(params.get('inv') || params.get('aff'));

  let urlInvoice: InvoiceState | null = null;
  let urlAffiliate: AffiliateInvoiceState | null = null;

  if (type === 'invoice') {
    urlInvoice = data as InvoiceState;
  } else if (type === 'affiliate') {
    urlAffiliate = data as AffiliateInvoiceState;
    urlInvoice = data as InvoiceState;
  }

  // Determine what to render:
  // 1. URL-loaded invoice (from link click)
  // 2. Manually pasted invoice
  // 3. Demo (nothing loaded yet)
  const activeInvoice = urlInvoice ?? manualInvoice ?? (!hasUrlParams && !manualInvoice ? DEMO_INVOICE : null);
  const activeAffiliate = urlAffiliate ?? manualAffiliate ?? null;
  const isDemo = !hasUrlParams && !manualInvoice;
  const isUrlParseError = hasUrlParams && !urlInvoice && !urlAffiliate;

  const handleLoad = () => {
    setPasteError(null);
    const result = parseRawInput(pasteInput);
    if (result.error) {
      setPasteError(result.error);
      return;
    }
    if (!result.invoice) {
      setPasteError('Paste an invoice link to continue.');
      return;
    }
    setManualInvoice(result.invoice);
    setManualAffiliate(result.affiliateData);
    setPasteInput('');
    // Update URL so the loaded invoice is shareable
    const encoded = result.affiliateData
      ? new URLSearchParams({ aff: pasteInput.trim().includes('aff=')
          ? (new URL(pasteInput.startsWith('http') ? pasteInput : 'https://x.com/' + pasteInput).searchParams.get('aff') ?? '')
          : pasteInput.trim() })
      : new URLSearchParams({ inv: pasteInput.trim().includes('inv=')
          ? (new URL(pasteInput.startsWith('http') ? pasteInput : 'https://x.com/' + pasteInput).searchParams.get('inv') ?? '')
          : pasteInput.trim() });
    navigate(`/gateway?${encoded.toString()}`, { replace: true });
  };

  const handleClear = () => {
    setManualInvoice(null);
    setManualAffiliate(null);
    setPasteInput('');
    setPasteError(null);
    navigate('/gateway', { replace: true });
  };

  return (
    <div className="page-center" style={{ flexDirection: 'column', gap: '24px', alignItems: 'center' }}>

      {/* ─── DIRECT INVOICE INPUT ──────────────────────────────────────────── */}
      {!hasUrlParams && !manualInvoice && (
        <div style={{ width: '100%', maxWidth: 480 }} className="animate-fade-in">
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={16} color="var(--text-secondary)" />
                <span className="section-label">Direct invoice input</span>
              </div>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}>
                Paste an invoice link or encoded payload below to load the checkout — no redirect needed.
              </p>
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Link2
                  size={14}
                  color="var(--text-disabled)"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  id="paste-invoice-input"
                  className={`input-field mono ${pasteError ? 'error' : ''}`}
                  style={{ paddingLeft: '34px', fontSize: '12px' }}
                  placeholder="Paste invoice link, URL, or encoded payload…"
                  value={pasteInput}
                  onChange={e => { setPasteInput(e.target.value); setPasteError(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleLoad()}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <button
                id="load-invoice-btn"
                className="btn btn-primary"
                style={{ flexShrink: 0, fontSize: '12px', padding: '0 18px' }}
                onClick={handleLoad}
                disabled={!pasteInput.trim()}
              >
                Load invoice
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Error banner */}
            {pasteError && (
              <div
                className="banner"
                style={{
                  background: 'var(--error-muted)',
                  border: '1px solid rgba(248, 113, 113, 0.15)',
                  color: 'var(--error)',
                  fontSize: '12px',
                  padding: '10px 14px',
                }}
              >
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontFamily: 'var(--font-sans)' }}>{pasteError}</span>
              </div>
            )}

            {/* Format hint */}
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              lineHeight: 1.7,
            }}>
              Accepts:{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-disabled)' }}>
                https://…/gateway?inv=…
              </span>
              {' · '}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-disabled)' }}>
                /gateway?inv=…
              </span>
              {' · '}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-disabled)' }}>
                eyJ…
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── CLEAR BUTTON when a manually loaded invoice is active ─────────── */}
      {(manualInvoice || hasUrlParams) && (
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <button
            className="btn btn-ghost"
            style={{
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              flexShrink: 0,
            }}
            onClick={handleClear}
          >
            <X size={12} />
            Load different invoice
          </button>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>
      )}

      {/* ─── DEMO BANNER ───────────────────────────────────────────────────── */}
      {isDemo && (
        <div className="banner banner-amber" style={{ maxWidth: 480, width: '100%', fontSize: '13px' }}>
          <AlertTriangle size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontFamily: 'var(--font-sans)' }}>
            <strong>Demo preview</strong> — paste a real invoice link above, or generate one on the{' '}
            <a href="/" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Merchant page</a>.
          </span>
        </div>
      )}

      {/* ─── URL PARSE ERROR ───────────────────────────────────────────────── */}
      {isUrlParseError && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '36px 32px',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
            <CatchMascot state="error" size={80} />
          </div>

          <div style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--error)',
          }}>
            Invalid invoice payload
          </div>

          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 340,
          }}>
            This link appears malformed or expired. Ask the merchant to generate a new one, or paste it into the field below.
          </p>

          <button
            className="btn btn-ghost btn-full"
            onClick={handleClear}
            style={{ fontSize: '12px', marginTop: '4px' }}
          >
            <X size={13} />
            Try a different link
          </button>
        </div>
      )}

      {/* ─── CHECKOUT CARD ─────────────────────────────────────────────────── */}
      {activeInvoice && (
        <DeltaDashboard
          invoice={activeInvoice}
          affiliateData={activeAffiliate}
        />
      )}
    </div>
  );
};
