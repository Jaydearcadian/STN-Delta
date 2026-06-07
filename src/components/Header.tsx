// src/components/Header.tsx

import { Link, useLocation } from 'react-router-dom';
import { WalletBar } from './WalletBar';

export const Header = () => {
  const loc = useLocation();

  return (
    <header className="site-header app-content">
      <Link to="/" className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 100 100"
          style={{ overflow: 'visible', filter: 'drop-shadow(0 0 4px rgba(45, 212, 191, 0.3))' }}
        >
          <path
            d="M 50 15 L 85 80 L 58 80 Q 50 68 42 80 L 15 80 Z"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="14"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 300, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>STN-</span>
          <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>DELTA</span>
        </span>
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
          style={{ fontSize: '12px', padding: '7px 16px' }}
        >
          Pay Invoice
        </Link>
      </div>
    </header>
  );
};
