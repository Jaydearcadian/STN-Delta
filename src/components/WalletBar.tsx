// src/components/WalletBar.tsx
// TON Connect + RainbowKit (EVM) wallet connect buttons — side by side in header

import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Address } from '@ton/core';
import { isTestnet } from '../config/networks';

const truncate = (addr: string, head = 6, tail = 4) =>
  `${addr.slice(0, head)}…${addr.slice(-tail)}`;

// ─── TON Wallet Button ────────────────────────────────────────────────────────

export const TonWalletButton = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  if (wallet) {
    const addr = wallet.account.address;
    const displayAddress = addr ? Address.parse(addr).toString({ bounceable: false }) : '';
    const display = displayAddress ? truncate(displayAddress, 4, 4) : 'TON';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          className="wallet-btn wallet-btn-ton connected"
          onClick={() => tonConnectUI.disconnect()}
          title="Click to disconnect"
        >
          <span className="wallet-dot" />
          {display}
        </button>
      </div>
    );
  }

  return (
    <button
      className="wallet-btn wallet-btn-ton"
      onClick={() => tonConnectUI.openModal()}
    >
      <TonIcon />
      Connect TON
    </button>
  );
};

// ─── EVM Wallet Button ────────────────────────────────────────────────────────

export const EvmWalletButton = () => {
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        className="wallet-btn wallet-btn-evm connected"
        onClick={() => disconnect()}
        title="Click to disconnect"
      >
        <span className="wallet-dot" />
        {truncate(address)}
      </button>
    );
  }

  return (
    <button
      className="wallet-btn wallet-btn-evm"
      onClick={openConnectModal}
    >
      <BaseIcon />
      Connect EVM
    </button>
  );
};

// ─── Combined bar (used in header) ───────────────────────────────────────────

export const WalletBar = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {isTestnet && (
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '8px',
        letterSpacing: '0.1em',
        color: 'var(--color-amber)',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '3px',
        padding: '2px 6px',
      }}>
        TESTNET
      </span>
    )}
    <TonWalletButton />
    <EvmWalletButton />
  </div>
);

// ─── Mini SVG icons ───────────────────────────────────────────────────────────

const TonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="28" fill="#0098EA"/>
    <path d="M37.6 15H18.4c-3.6 0-5.7 4-3.7 7l11.5 18.5a2.3 2.3 0 0 0 3.6 0L41.3 22c2-3-.1-7-3.7-7z" fill="#fff"/>
  </svg>
);

const BaseIcon = () => (
  <svg width="13" height="13" viewBox="0 0 111 111" fill="none">
    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
    <path d="M55.7 81.3a25.8 25.8 0 1 0 0-51.6 25.8 25.8 0 0 0 0 51.6z" fill="#fff"/>
  </svg>
);
