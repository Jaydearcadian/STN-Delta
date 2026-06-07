// src/App.tsx
// Application root — router, layout shell

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { MerchantPage } from './pages/MerchantPage';
import { GatewayPage } from './pages/GatewayPage';
import { AffiliatePage } from './pages/AffiliatePage';
import { DashboardPage } from './pages/DashboardPage';

const Footer = () => (
  <footer className="site-footer app-content">
    <span>STN-Delta · STON.fi Vibe Coding Hackathon · 2026</span>
    <span>Zero Waste. Full Yield. · Omniston v1beta8</span>
  </footer>
);

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Header />
        <main className="app-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<MerchantPage />} />
            <Route path="/gateway" element={<GatewayPage />} />
            <Route path="/affiliate" element={<AffiliatePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
