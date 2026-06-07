// src/components/Header.tsx

import { Link, useLocation } from 'react-router-dom';
import { WalletBar } from './WalletBar';

export const Header = () => {
  const loc = useLocation();

  return (
    <header className="site-header app-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Link to="/" className="header-logo">
        <span className="header-logo-dot animate-pulse-glow" />
        STN-DELTA <span style={{ color: 'var(--color-slate-600)', fontWeight: 300 }}>// GATEWAY</span>
      </Link>

      <nav className="header-nav">
        <Link to="/" className={`nav-link ${loc.pathname === '/' ? 'active' : ''}`}>
          Merchant
        </Link>
        <Link to="/dashboard" className={`nav-link ${loc.pathname === '/dashboard' ? 'active' : ''}`}>
          Dashboard
        </Link>
        <Link to="/affiliate" className={`nav-link ${loc.pathname === '/affiliate' ? 'active' : ''}`}>
          Affiliates
        </Link>
        <a
          href="https://ston.fi"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
        >
          STON.fi ↗
        </a>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <WalletBar />
        <Link
          to="/gateway"
          className="btn btn-primary"
          style={{ fontSize: '11px', padding: '5px 14px' }}
        >
          Pay Invoice
        </Link>
      </div>
    </header>
  );
};
