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
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="banner banner-emerald" style={{ alignItems: 'center' }}>
          <CheckCircle size={16} color="var(--color-emerald)" />
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--color-emerald)', marginBottom: '2px' }}>
              POSITION DEPLOYED
            </div>
            <div style={{ fontSize: '12px' }}>{result.description}</div>
          </div>
        </div>

        <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Object.entries(result.details).map(([k, v]) => (
            <div key={k} className="metric-row">
              <span className="metric-label">{k}</span>
              <span className="metric-value" style={{ fontSize: '11px', color: 'var(--color-slate-200)' }}>{v}</span>
            </div>
          ))}
          <hr className="metric-divider" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-600)', letterSpacing: '0.06em' }}>
            TX: {result.txHash.slice(0, 20)}...{result.txHash.slice(-8)}
            <a
              href={`https://tonscan.org/tx/${result.txHash}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-cyan)', marginLeft: '6px', textDecoration: 'none' }}
            >
              <ExternalLink size={10} style={{ verticalAlign: 'middle' }} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── SELECTOR VIEW ────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Invoice settled banner */}
      <div style={{ textAlign: 'center', padding: '4px 0' }}>
        <div className="animate-success-burst" style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(16,185,129,0.1)',
          border: '1px solid rgba(16,185,129,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 10px',
        }}>
          <CheckCircle size={24} color="var(--color-emerald)" />
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald)' }}>
          INVOICE SETTLED
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-slate-400)', marginTop: '3px' }}>
          Merchant received exactly ${invoiceAmount} USDT
        </div>
      </div>

      {/* Merchant address confirmation */}
      <div className="card-inner">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)', marginBottom: '4px' }}>MERCHANT WALLET</div>
        <div className="address-box" style={{ fontSize: '9px' }}>{merchantAddress}</div>
      </div>

      {/* Residual display */}
      <div className="banner banner-cyan">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--color-slate-500)' }}>RESIDUAL CAPTURED</span>
            <span style={{ color: 'var(--color-cyan)', fontWeight: 700, fontSize: '14px' }}>${residualUsdt.toFixed(2)}</span>
          </div>
          <div style={{ color: 'var(--color-slate-500)', fontSize: '9px' }}>
            Converted to TON → seeded to your new wallet. Deploy it now:
          </div>
        </div>
      </div>

      {/* Diversification tab selector */}
      <div>
        <div style={{ marginBottom: '10px' }}>
          <span className="section-label">DEPLOY RESIDUAL</span>
        </div>
        <div className="tab-bar" style={{ marginBottom: '12px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              style={activeTab === tab.id ? { color: `var(--color-${tab.color})` } : {}}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
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
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600, color: 'var(--color-slate-200)' }}>
                    {pool.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                    TVL: ${(pool.tvlUsd / 1_000_000).toFixed(1)}M
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald)' }}>
                  {pool.aprPct}%
                  <div style={{ fontSize: '9px', color: 'var(--color-slate-500)', fontWeight: 400 }}>APR</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* xStocks selector */}
        {activeTab === 'X_STOCKS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="banner banner-amber" style={{ marginBottom: '4px', fontSize: '11px' }}>
              <BarChart2 size={13} color="var(--color-amber)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Tokenized equities — non-custodial, no-KYC, exclusive to STON.fi on TON</span>
            </div>
            {XSTOCKS.map(stock => (
              <label
                key={stock.contractAddress}
                className={`toggle-row ${selectedStock === stock.contractAddress ? 'active' : ''}`}
                style={{ cursor: 'pointer', borderColor: selectedStock === stock.contractAddress ? 'rgba(245,158,11,0.4)' : '' }}
                onClick={() => setSelectedStock(stock.contractAddress)}
              >
                <div className={`toggle-checkbox ${selectedStock === stock.contractAddress ? 'checked' : ''}`}
                  style={selectedStock === stock.contractAddress ? { background: 'var(--color-amber)', borderColor: 'var(--color-amber)' } : {}} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--color-amber)' }}>
                    {stock.symbol}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-slate-500)' }}>
                    {stock.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--color-slate-200)' }}>
                    ${stock.priceMock.toFixed(2)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: stock.changePct >= 0 ? 'var(--color-emerald)' : 'var(--color-red)' }}>
                    {stock.changePct >= 0 ? '+' : ''}{stock.changePct}%
                  </div>
                </div>
              </label>
            ))}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-slate-600)', textAlign: 'center', marginTop: '2px' }}>
              Fractional shares via Omniston swap routing
            </div>
          </div>
        )}

        {/* DAO Stake */}
        {activeTab === 'DAO_STAKE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="banner banner-purple">
              <Vote size={13} color="var(--color-purple)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '11px' }}>
                Swap residual → $STON → lock in governance contract → receive ARKENSTON NFT (soul-bound voter ID) + GEMSTON yield tokens
              </span>
            </div>
            <div className="card-inner" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="metric-row">
                <span className="metric-label">Estimated APR</span>
                <span className="metric-value" style={{ color: 'var(--color-purple)', fontWeight: 700 }}>{DAO_STAKE.aprPct}%</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Lock Period</span>
                <span className="metric-value">{DAO_STAKE.lockDays} days</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">ARKENSTON NFT</span>
                <span className="metric-value emerald">Minted on deposit</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Governance</span>
                <span className="metric-value" style={{ color: 'var(--color-purple)' }}>Active DAO voter</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">GEMSTON Yield</span>
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
        style={{ fontSize: '12px' }}
      >
        {deploying ? (
          <>
            <div className="spinner spinner-sm" />
            ROUTING...
          </>
        ) : (
          <>
            {activeTab === 'AMM_POOL' && <TrendingUp size={14} />}
            {activeTab === 'X_STOCKS' && <BarChart2 size={14} />}
            {activeTab === 'DAO_STAKE' && <Vote size={14} />}
            {activeTab === 'AMM_POOL' && 'DEPLOY SEED INTO POOL'}
            {activeTab === 'X_STOCKS' && `BUY ${XSTOCKS.find(s => s.contractAddress === selectedStock)?.symbol ?? 'xSTOCK'}`}
            {activeTab === 'DAO_STAKE' && 'STAKE → MINT ARKENSTON'}
          </>
        )}
      </button>
    </div>
  );
};
