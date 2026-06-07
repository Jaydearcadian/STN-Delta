// src/pages/AffiliatePage.tsx
// Affiliate portal — simulated referral analytics + link generator

import { useState } from 'react';
import { TrendingUp, Copy, Check, Share2, Zap, ExternalLink } from 'lucide-react';

// Simulated affiliate analytics data
const MOCK_STATS = [
  { period: 'Today',    clicks: 34,   volume: 1_820.50, earned: 3.64 },
  { period: 'This Week',clicks: 187,  volume: 9_440.00, earned: 18.88 },
  { period: 'All Time', clicks: 1_204, volume: 62_180.00, earned: 124.36 },
];

const MOCK_RECENT: Array<{ time: string; amount: string; commission: string; tx: string }> = [
  { time: '2m ago',  amount: '$50.00 USDT', commission: '$0.10',  tx: '0xd4e8...f201' },
  { time: '14m ago', amount: '$120.00 USDT',commission: '$0.24',  tx: '0xa12c...8b7e' },
  { time: '1h ago',  amount: '$300.00 USDT',commission: '$0.60',  tx: '0xf83a...44d0' },
  { time: '3h ago',  amount: '$75.50 USDT', commission: '$0.151', tx: '0xc29b...9101' },
  { time: '8h ago',  amount: '$50.00 USDT', commission: '$0.10',  tx: '0xe731...b59a' },
];

export const AffiliatePage = () => {
  const [wallet, setWallet] = useState('');
  const [baseInvoiceUrl, setBaseInvoiceUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeStatIdx, setActiveStatIdx] = useState(2);

  const stat = MOCK_STATS[activeStatIdx];

  const handleGenerate = () => {
    if (!wallet || !baseInvoiceUrl) return;
    // Extract the inv= param from the base URL and re-encode as affiliate link
    try {
      const url = new URL(baseInvoiceUrl.includes('://') ? baseInvoiceUrl : 'https://placeholder.com' + (baseInvoiceUrl.startsWith('/') ? baseInvoiceUrl : '/' + baseInvoiceUrl));
      const inv = url.searchParams.get('inv');
      if (!inv) {
        alert('Paste a valid invoice link with ?inv= parameter');
        return;
      }
      const encoded = btoa(JSON.stringify({ wallet, alias, feePct: 0.2 }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      setAffiliateLink(`${window.location.origin}/gateway?aff=${inv}_ref_${encoded}`);
    } catch {
      // If URL parse fails, generate a demo link
      const demoPayload = {
        merchant: 'EQAdemoMerchant123456789012345678901234567890123456',
        amount: '50.00',
        asset: 'EQCxE6mUoGEyB7j9meA_3O9CgjWb8A1mYb9bA1b7Doo2Tok',
        assetSymbol: 'USDT',
        id: 'INV-DEMO-AFF',
        mode: 'SOLO',
        affiliateWallet: wallet,
        affiliateAlias: alias || undefined,
        referrerFeePct: 0.2,
      };
      const enc = btoa(unescape(encodeURIComponent(JSON.stringify(demoPayload))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      setAffiliateLink(`${window.location.origin}/gateway?aff=${enc}`);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-wide">
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <span className="section-label amber">AFFILIATE PORTAL</span>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '10px', lineHeight: 1.2 }}>
          Earn from Every Swap
        </h1>
        <p style={{ color: 'var(--color-slate-400)', fontSize: '13px', marginTop: '6px', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-amber)' }}>0.2%</strong> of every swap amount, paid automatically to your wallet.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* ─── ANALYTICS ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Period selector + KPIs */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
              {MOCK_STATS.map((s, i) => (
                <button
                  key={s.period}
                  className={`tab-item ${activeStatIdx === i ? 'active' : ''}`}
                  onClick={() => setActiveStatIdx(i)}
                  style={{ fontSize: '10px' }}
                >
                  {s.period}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Link Clicks', value: stat.clicks.toLocaleString(), color: 'var(--color-cyan)' },
                { label: 'Volume Routed', value: `$${stat.volume.toLocaleString()}`, color: 'var(--color-slate-200)' },
                { label: 'Earned (USDC)', value: `$${stat.earned.toFixed(2)}`, color: 'var(--color-emerald)' },
              ].map(kpi => (
                <div key={kpi.label} style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  padding: '14px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: kpi.color }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-600)', marginTop: '4px', letterSpacing: '0.08em' }}>
                    {kpi.label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* Mini rate formula */}
            <div style={{
              marginTop: '14px',
              padding: '10px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-slate-500)',
              textAlign: 'center',
            }}>
              Commission = <span style={{ color: 'var(--color-cyan)' }}>swap_volume</span> × <span style={{ color: 'var(--color-amber)' }}>0.2%</span>
              {' '}= <span style={{ color: 'var(--color-amber)' }}>$9,440</span> × 0.002 = <span style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>$18.88</span>
            </div>
          </div>

          {/* Recent payouts */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span className="section-label emerald">RECENT COMMISSIONS</span>
              <TrendingUp size={12} color="var(--color-emerald)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MOCK_RECENT.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '7px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                }}>
                  <div className="status-dot emerald" />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: 'var(--color-slate-300)' }}>{r.amount}</span>
                    <span style={{ color: 'var(--color-slate-600)', marginLeft: '8px', fontSize: '10px' }}>{r.time}</span>
                  </div>
                  <div style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>{r.commission}</div>
                  <a
                    href={`https://tonscan.org/tx/${r.tx}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--color-slate-600)' }}
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <span className="section-label">HOW IT WORKS</span>
            </div>
            {[
              ['01', 'Paste an invoice link from a merchant', 'var(--color-cyan)'],
              ['02', 'Add your TON wallet as referrer', 'var(--color-cyan)'],
              ['03', 'Share your affiliate variant via Telegram', 'var(--color-amber)'],
              ['04', 'You earn 0.2% of the swap amount on every payment', 'var(--color-emerald)'],
              ['05', 'Commissions land directly to your wallet', 'var(--color-emerald)'],
            ].map(([num, text, color]) => (
              <div key={num} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: color as string,
                  flexShrink: 0,
                  paddingTop: '1px',
                }}>
                  {num}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-slate-400)', lineHeight: 1.5 }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── LINK GENERATOR ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span className="section-label amber">GENERATE YOUR AFFILIATE LINK</span>
            </div>

            <div>
              <label className="input-label">YOUR TON WALLET (receives commissions)</label>
              <input
                id="affiliate-ton-wallet"
                className="input-field"
                placeholder="EQA... your wallet address"
                value={wallet}
                onChange={e => setWallet(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">BASE INVOICE LINK (from merchant)</label>
              <input
                id="affiliate-base-invoice"
                className="input-field"
                placeholder="/gateway?inv=... or paste full URL"
                value={baseInvoiceUrl}
                onChange={e => setBaseInvoiceUrl(e.target.value)}
              />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-600)', marginTop: '4px' }}>
                Leave blank to generate a demo link
              </div>
            </div>

            <div>
              <label className="input-label">DISPLAY ALIAS (optional)</label>
              <input
                id="affiliate-display-alias"
                className="input-field"
                placeholder="@telegram_handle or name"
                value={alias}
                onChange={e => setAlias(e.target.value)}
              />
            </div>

            <div className="banner banner-amber" style={{ fontSize: '11px' }}>
              <Zap size={12} color="var(--color-amber)" style={{ flexShrink: 0 }} />
              <span>
                Your wallet is encoded into the link. When someone pays through it, <strong>0.2%</strong> of the payment is automatically sent to your wallet — no extra setup needed.
              </span>
            </div>

            <button
              id="generate-affiliate-link-btn"
              className="btn btn-primary btn-full"
              onClick={handleGenerate}
              disabled={!wallet}
            >
              <Zap size={13} />
              GENERATE AFFILIATE LINK
            </button>

            {/* Output */}
            {affiliateLink && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)', letterSpacing: '0.08em' }}>
                  YOUR AFFILIATE LINK:
                </div>
                <div className="address-box" style={{ fontSize: '9px' }}>{affiliateLink}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`btn btn-ghost ${copied ? 'btn-emerald' : ''}`}
                    style={{ flex: 1, fontSize: '10px' }}
                    onClick={copyLink}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'COPIED!' : 'COPY LINK'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1, fontSize: '10px' }}
                    onClick={() => {
                      const text = encodeURIComponent(`💰 I earn 0.2% every time you use this payment link!\n\nPay here: ${affiliateLink}`);
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${text}`, '_blank');
                    }}
                  >
                    <Share2 size={12} />
                    TELEGRAM
                  </button>
                </div>
                <a
                  href={affiliateLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-full"
                  style={{ fontSize: '10px' }}
                >
                  PREVIEW GATEWAY →
                </a>
              </div>
            )}
          </div>

          {/* Protocol info */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <span className="section-label">PROTOCOL PARAMETERS</span>
            </div>
            <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                ['Referral fee', '0.2% per swap'],
                ['Calculated on', 'Total swap volume'],
                ['Settlement', 'Atomic (HTLC)'],
                ['Payout currency', 'USDT / TON (auto)'],
                ['Payout timing', 'Instant on settlement'],
                ['KYC Required', 'None'],
                ['Max referrers', 'Unlimited'],
              ].map(([k, v]) => (
                <div key={k} className="metric-row">
                  <span className="metric-label" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{k}</span>
                  <span className="metric-value" style={{ color: 'var(--color-cyan)', fontSize: '11px' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
