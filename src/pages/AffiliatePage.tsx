// src/pages/AffiliatePage.tsx
// Affiliate portal — simulated referral analytics + link generator

import { useState } from 'react';
import { TrendingUp, Copy, Check, Share2, Zap, ExternalLink } from 'lucide-react';

const MOCK_STATS = [
  { period: 'Today',    clicks: 0,   volume: 0, earned: 0 },
  { period: 'This Week',clicks: 0,  volume: 0, earned: 0 },
  { period: 'All Time', clicks: 0, volume: 0, earned: 0 },
];

const MOCK_RECENT: Array<{ time: string; amount: string; commission: string; tx: string }> = [];

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
      <div style={{ marginBottom: '32px' }}>
        <span className="section-label amber">Affiliate portal</span>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '26px', fontWeight: 700, marginTop: '12px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          Earn from Every Swap
        </h1>
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--warning)' }}>0.2%</strong> of every swap amount, paid automatically to your wallet.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* ─── ANALYTICS ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Period selector + KPIs */}
          <div className="card" style={{ padding: '24px' }}>
            <div className="tab-bar" style={{ marginBottom: '20px' }}>
              {MOCK_STATS.map((s, i) => (
                <button
                  key={s.period}
                  className={`tab-item ${activeStatIdx === i ? 'active' : ''}`}
                  onClick={() => setActiveStatIdx(i)}
                >
                  {s.period}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              {[
                { label: 'Link clicks',    value: stat.clicks.toLocaleString(), color: 'var(--accent)' },
                { label: 'Volume routed',   value: `$${stat.volume.toLocaleString()}`, color: 'var(--text-primary)' },
                { label: 'Earned (USDC)',    value: `$${stat.earned.toFixed(2)}`, color: 'var(--success)' },
              ].map(kpi => (
                <div key={kpi.label} style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: kpi.color, letterSpacing: '-0.02em' }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginTop: '6px' }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Mini rate formula */}
            <div style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}>
              Commission = <span style={{ color: 'var(--accent)' }}>swap_volume</span> × <span style={{ color: 'var(--warning)' }}>0.2%</span>
              {' '}= <span style={{ color: 'var(--warning)' }}>$9,440</span> × 0.002 = <span style={{ color: 'var(--success)', fontWeight: 700 }}>$18.88</span>
            </div>
          </div>

          {/* Recent payouts */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span className="section-label emerald">Recent commissions</span>
              <TrendingUp size={13} color="var(--success)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {MOCK_RECENT.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}>
                  <div className="status-dot emerald" />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{r.amount}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-disabled)', fontSize: '11px' }}>{r.time}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 700 }}>{r.commission}</div>
                  <a
                    href={`https://tonscan.org/tx/${r.tx}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--text-disabled)', display: 'flex' }}
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <span className="section-label">How it works</span>
            </div>
            {[
              ['01', 'Paste an invoice link from a merchant', 'var(--accent)'],
              ['02', 'Add your TON wallet as referrer', 'var(--accent)'],
              ['03', 'Share your affiliate variant via Telegram', 'var(--warning)'],
              ['04', 'You earn 0.2% of the swap amount on every payment', 'var(--success)'],
              ['05', 'Commissions land directly to your wallet', 'var(--success)'],
            ].map(([num, text, color]) => (
              <div key={num} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: color as string,
                  flexShrink: 0,
                  paddingTop: '1px',
                }}>
                  {num}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── LINK GENERATOR ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span className="section-label amber">Generate your affiliate link</span>
            </div>

            <div>
              <label className="input-label">Your TON wallet (receives commissions)</label>
              <input
                id="affiliate-ton-wallet"
                className="input-field mono"
                placeholder="EQA... your wallet address"
                value={wallet}
                onChange={e => setWallet(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">Base invoice link (from merchant)</label>
              <input
                id="affiliate-base-invoice"
                className="input-field"
                placeholder="/gateway?inv=... or paste full URL"
                value={baseInvoiceUrl}
                onChange={e => setBaseInvoiceUrl(e.target.value)}
              />
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-disabled)', marginTop: '6px' }}>
                Leave blank to generate a demo link
              </div>
            </div>

            <div>
              <label className="input-label">Display alias (optional)</label>
              <input
                id="affiliate-display-alias"
                className="input-field"
                placeholder="@telegram_handle or name"
                value={alias}
                onChange={e => setAlias(e.target.value)}
              />
            </div>

            <div className="banner banner-amber" style={{ fontSize: '12px' }}>
              <Zap size={13} color="var(--warning)" style={{ flexShrink: 0 }} />
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
              <Zap size={14} />
              Generate affiliate link
            </button>

            {/* Output */}
            {affiliateLink && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                  Your affiliate link
                </div>
                <div className="address-box" style={{ fontSize: '10px' }}>{affiliateLink}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className={`btn btn-ghost ${copied ? 'btn-emerald' : ''}`}
                    style={{ flex: 1 }}
                    onClick={copyLink}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const text = encodeURIComponent(`💰 I earn 0.2% every time you use this payment link!\n\nPay here: ${affiliateLink}`);
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(affiliateLink)}&text=${text}`, '_blank');
                    }}
                  >
                    <Share2 size={13} />
                    Telegram
                  </button>
                </div>
                <a
                  href={affiliateLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-full"
                >
                  Preview gateway →
                </a>
              </div>
            )}
          </div>

          {/* Protocol info */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '14px' }}>
              <span className="section-label">Protocol parameters</span>
            </div>
            <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  <span className="metric-label">{k}</span>
                  <span className="metric-value" style={{ color: 'var(--accent)' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
