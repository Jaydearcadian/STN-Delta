// src/pages/GatewayPage.tsx
// Payer-facing gateway — paste-to-load input + URL param checkout

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Link2, ArrowRight, X } from 'lucide-react';
import { parseGatewayUrl, InvoiceCodec, AffiliateCodec } from '../utils/codec';
import type { InvoiceState, AffiliateInvoiceState } from '../utils/codec';
import { DeltaDashboard } from '../components/DeltaDashboard';

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
    <div className="page-center" style={{ flexDirection: 'column', gap: '20px', alignItems: 'center' }}>

      {/* ─── PASTE-TO-LOAD PANEL ───────────────────────────────────────────── */}
      {!hasUrlParams && !manualInvoice && (
        <div style={{ width: '100%', maxWidth: 460 }}>
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span className="section-label">PAY AN INVOICE</span>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-slate-400)', marginTop: '6px' }}>
                Paste an invoice link directly here to start checkout — no redirect needed.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Link2
                  size={13}
                  color="var(--color-slate-600)"
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <input
                  id="paste-invoice-input"
                  className={`input-field ${pasteError ? 'error' : ''}`}
                  style={{ paddingLeft: '32px', fontSize: '11px' }}
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
                style={{ flexShrink: 0, fontSize: '11px', padding: '0 14px' }}
                onClick={handleLoad}
                disabled={!pasteInput.trim()}
              >
                LOAD
                <ArrowRight size={12} />
              </button>
            </div>

            {pasteError && (
              <div style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'flex-start',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-red)',
              }}>
                <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                {pasteError}
              </div>
            )}

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-700)', lineHeight: 1.6 }}>
              ACCEPTS: full URL (https://…/gateway?inv=…) · path (/gateway?inv=…) · raw payload (eyJ…)
            </div>
          </div>
        </div>
      )}

      {/* ─── CLEAR BUTTON when a manually loaded invoice is active ─────────── */}
      {(manualInvoice || hasUrlParams) && (
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          <button
            className="btn btn-ghost"
            style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', flexShrink: 0 }}
            onClick={handleClear}
          >
            <X size={11} />
            LOAD DIFFERENT INVOICE
          </button>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
        </div>
      )}

      {/* ─── DEMO BANNER ───────────────────────────────────────────────────── */}
      {isDemo && (
        <div className="banner banner-amber" style={{ maxWidth: 460, width: '100%', fontSize: '11px' }}>
          <AlertTriangle size={12} color="var(--color-amber)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Demo preview</strong> — paste a real invoice link above, or generate one on the{' '}
            <a href="/" style={{ color: 'var(--color-cyan)' }}>Merchant page</a>.
          </span>
        </div>
      )}

      {/* ─── URL PARSE ERROR ───────────────────────────────────────────────── */}
      {isUrlParseError && (
        <div className="card" style={{ padding: '32px', maxWidth: 460, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          <AlertTriangle size={32} color="var(--color-amber)" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--color-amber)' }}>
            INVALID INVOICE PAYLOAD
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-slate-400)', lineHeight: 1.5 }}>
            This link appears malformed or expired. Ask the merchant to generate a new one, or paste it into the field below.
          </div>
          <button className="btn btn-ghost btn-full" onClick={handleClear} style={{ fontSize: '11px' }}>
            <X size={12} /> TRY A DIFFERENT LINK
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
