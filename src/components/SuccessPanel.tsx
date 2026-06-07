// src/components/SuccessPanel.tsx
// Post-settlement upsell panel: AMM Pool / xStocks / DAO Stake selector

import { useState } from 'react';
import { TrendingUp, BarChart2, Vote, CheckCircle, ExternalLink } from 'lucide-react';
import {
  FEATURED_POOLS,
  XSTOCKS,
  DAO_STAKE,
  routeResidualValue,
} from '../utils/stonfiDeployer';
import type { DiversificationTarget, RoutingResult } from '../utils/stonfiDeployer';
import type { TonIdentity } from '../hooks/useDeltaEngine';
import { CatchMascot } from './CatchMascot';

type Props = {
  residualUsdt: number;
  tonIdentity: TonIdentity;
  invoiceAmount: string;
  merchantAddress: string;
};

type UITarget = 'AMM_POOL' | 'X_STOCKS' | 'DAO_STAKE';

const TABS: Array<{ id: UITarget; label: string; icon: typeof TrendingUp; color: string }> = [
  { id: 'AMM_POOL',  label: 'LP Pool',  icon: TrendingUp, color: 'cyan' },
  { id: 'X_STOCKS',  label: 'xStocks',  icon: BarChart2,  color: 'amber' },
  { id: 'DAO_STAKE', label: 'DAO Stake', icon: Vote,       color: 'purple' },
];

export const SuccessPanel = ({ residualUsdt, tonIdentity, invoiceAmount, merchantAddress }: Props) => {
  const [activeTab, setActiveTab] = useState<UITarget>('AMM_POOL');
  const [selectedPool, setSelectedPool] = useState(FEATURED_POOLS[0].address);
  const [selectedStock, setSelectedStock] = useState(XSTOCKS[0].contractAddress);
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<RoutingResult | null>(null);

  const handleDeploy = async () => {
    setDeploying(true);
    setResult(null);
    try {
      const target = activeTab === 'AMM_POOL' ? selectedPool
        : activeTab === 'X_STOCKS' ? selectedStock
        : DAO_STAKE.contractAddress;

      const res = await routeResidualValue({
        userNewTonWallet: tonIdentity.address,
        residualAmountUsdt: residualUsdt,
        targetType: activeTab as DiversificationTarget,
        targetContract: target,
      });
      setResult(res);
    } finally {
      setDeploying(false);
    }
  };

  // ─── SETTLED RESULT VIEW ─────────────────────────────────────────────────
  if (result?.success) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="banner banner-emerald" style={{ alignItems: 'center' }}>
          <CheckCircle size={18} color="var(--success)" />
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, color: 'var(--success)', marginBottom: '2px' }}>
              Position deployed
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--text-secondary)' }}>{result.description}</div>
          </div>
        </div>

        <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Object.entries(result.details).map(([k, v]) => (
            <div key={k} className="metric-row">
              <span className="metric-label">{k}</span>
              <span className="metric-value">{v}</span>
            </div>
          ))}
          <hr className="metric-divider" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-disabled)' }}>
              TX: {result.txHash.slice(0, 20)}...{result.txHash.slice(-8)}
            </span>
            <a
              href={`https://tonscan.org/tx/${result.txHash}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex' }}
            >
              <ExternalLink size={11} style={{ verticalAlign: 'middle' }} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── SELECTOR VIEW ────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Invoice settled hero moment */}
      <div style={{ textAlign: 'center', padding: '12px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
          <CatchMascot state="success" size={80} />
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '18px', fontWeight: 700, color: 'var(--success)', letterSpacing: '-0.01em' }}>
          Invoice Settled
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Merchant received exactly <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>${invoiceAmount}</span> USDT
        </div>
      </div>

      {/* Merchant address confirmation */}
      <div className="card-inner">
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>Merchant wallet</div>
        <div className="address-box" style={{ fontSize: '10px' }}>{merchantAddress}</div>
      </div>

      {/* Residual display */}
      <div className="banner banner-cyan">
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Residual captured</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>${residualUsdt.toFixed(2)}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-muted)', fontSize: '12px' }}>
            Converted to TON → seeded to your new wallet. Deploy it now:
          </div>
        </div>
      </div>

      {/* Diversification tab selector */}
      <div>
        <div style={{ marginBottom: '12px' }}>
          <span className="section-label">Deploy residual</span>
        </div>
        <div className="tab-bar" style={{ marginBottom: '14px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              style={activeTab === tab.id ? { color: `var(--color-${tab.color})` } : {}}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* AMM Pool selector */}
        {activeTab === 'AMM_POOL' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FEATURED_POOLS.map(pool => (
              <label
                key={pool.address}
                className={`toggle-row ${selectedPool === pool.address ? 'active' : ''}`}
                onClick={() => setSelectedPool(pool.address)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`toggle-checkbox ${selectedPool === pool.address ? 'checked' : ''}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {pool.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    TVL: ${(pool.tvlUsd / 1_000_000).toFixed(1)}M
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--success)' }}>
                    {pool.aprPct}%
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>APR</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* xStocks selector */}
        {activeTab === 'X_STOCKS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="banner banner-amber" style={{ marginBottom: '4px', fontSize: '12px' }}>
              <BarChart2 size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Tokenized equities — non-custodial, no-KYC, exclusive to STON.fi on TON</span>
            </div>
            {XSTOCKS.map(stock => (
              <label
                key={stock.contractAddress}
                className={`toggle-row ${selectedStock === stock.contractAddress ? 'active' : ''}`}
                style={{ cursor: 'pointer', borderColor: selectedStock === stock.contractAddress ? 'rgba(251,191,36,0.4)' : '' }}
                onClick={() => setSelectedStock(stock.contractAddress)}
              >
                <div className={`toggle-checkbox ${selectedStock === stock.contractAddress ? 'checked' : ''}`}
                  style={selectedStock === stock.contractAddress ? { background: 'var(--warning)', borderColor: 'var(--warning)' } : {}} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--warning)' }}>
                    {stock.symbol}
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {stock.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${stock.price.toFixed(2)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: stock.changePct >= 0 ? 'var(--success)' : 'var(--error)' }}>
                    {stock.changePct >= 0 ? '+' : ''}{stock.changePct}%
                  </div>
                </div>
              </label>
            ))}
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-disabled)', textAlign: 'center', marginTop: '4px' }}>
              Fractional shares via Omniston swap routing
            </div>
          </div>
        )}

        {/* DAO Stake */}
        {activeTab === 'DAO_STAKE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="banner banner-purple">
              <Vote size={14} color="var(--purple)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '12px' }}>
                Swap residual → $STON → lock in governance contract → receive ARKENSTON NFT (soul-bound voter ID) + GEMSTON yield tokens
              </span>
            </div>
            <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="metric-row">
                <span className="metric-label">Estimated APR</span>
                <span className="metric-value" style={{ color: 'var(--purple)', fontWeight: 700 }}>{DAO_STAKE.aprPct}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Lock period</span>
                <span className="metric-value">{DAO_STAKE.lockDays} days</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">ARKENSTON NFT</span>
                <span className="metric-value emerald">Minted on deposit</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Governance</span>
                <span className="metric-value" style={{ color: 'var(--purple)' }}>Active DAO voter</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">GEMSTON yield</span>
                <span className="metric-value emerald">Streaming</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deploy CTA */}
      <button
        id="deploy-residual-btn"
        className={`btn btn-full ${
          activeTab === 'X_STOCKS' ? 'btn-primary' :
          activeTab === 'DAO_STAKE' ? 'btn-purple' :
          'btn-emerald'
        }`}
        onClick={handleDeploy}
        disabled={deploying}
      >
        {deploying ? (
          <>
            <div className="spinner spinner-sm" />
            Routing...
          </>
        ) : (
          <>
            {activeTab === 'AMM_POOL' && <TrendingUp size={14} />}
            {activeTab === 'X_STOCKS' && <BarChart2 size={14} />}
            {activeTab === 'DAO_STAKE' && <Vote size={14} />}
            {activeTab === 'AMM_POOL' && 'Deploy seed into pool'}
            {activeTab === 'X_STOCKS' && `Buy ${XSTOCKS.find(s => s.contractAddress === selectedStock)?.symbol ?? 'xSTOCK'}`}
            {activeTab === 'DAO_STAKE' && 'Stake → Mint Arkenston'}
          </>
        )}
      </button>
    </div>
  );
};
