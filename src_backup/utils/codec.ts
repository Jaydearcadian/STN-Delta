// src/utils/codec.ts
// URL-safe Base64 encoding for invoice & affiliate payloads — zero database, zero backend

export type InvoiceState = {
  merchant: string;   // Target TON wallet address
  amount: string;     // Exact settlement amount (e.g. "50.00")
  asset: string;      // Jetton contract address on TON (e.g. USDT)
  assetSymbol: string;// Human-readable symbol (e.g. "USDT")
  id: string;         // Unique invoice nonce
  mode?: 'SOLO' | 'GROUP'; // Payment mode
  groupSize?: number; // Number of payers (GROUP mode)
  payerIndex?: number; // Which payer this link is for (0-indexed)
};

export type AffiliateInvoiceState = InvoiceState & {
  affiliateWallet: string; // TON wallet receiving 0.2% commission
  affiliateAlias?: string; // Optional display name
  referrerFeePct: number;  // 0.2 — passed to Omniston as referrerFeeBps: 20
};

const _encode = (obj: object): string => {
  const json = JSON.stringify(obj);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const _decode = <T>(payload: string): T | null => {
  try {
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(decodeURIComponent(escape(atob(b64)))) as T;
  } catch {
    return null;
  }
};

export const InvoiceCodec = {
  encode: (state: InvoiceState): string => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/gateway?inv=${_encode(state)}`;
  },

  decode: (payload: string): InvoiceState | null =>
    _decode<InvoiceState>(payload),
};

export const AffiliateCodec = {
  encode: (state: AffiliateInvoiceState): string => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return `${base}/gateway?aff=${_encode(state)}`;
  },

  decode: (payload: string): AffiliateInvoiceState | null =>
    _decode<AffiliateInvoiceState>(payload),
};

// Generate a unique invoice ID (deterministic nonce)
export const generateInvoiceId = (): string => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
};

// Parse whatever link type is in the URL
export const parseGatewayUrl = (
  searchParams: URLSearchParams
): { type: 'invoice' | 'affiliate' | null; data: InvoiceState | AffiliateInvoiceState | null } => {
  const inv = searchParams.get('inv');
  const aff = searchParams.get('aff');

  if (aff) {
    const data = AffiliateCodec.decode(aff);
    return { type: data ? 'affiliate' : null, data };
  }
  if (inv) {
    const data = InvoiceCodec.decode(inv);
    return { type: data ? 'invoice' : null, data };
  }
  return { type: null, data: null };
};
