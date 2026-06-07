// src/config/wagmi.ts
// Wagmi + RainbowKit config for Base Sepolia (testnet) and Base Mainnet

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia, base } from 'wagmi/chains';
import { WALLETCONNECT_PROJECT_ID, ACTIVE_ENV } from './networks';

export const wagmiConfig = getDefaultConfig({
  appName: 'STN-Delta Gateway',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: ACTIVE_ENV === 'testnet'
    ? [baseSepolia, base]        // testnet first so it's default
    : [base, baseSepolia],       // mainnet first for production
  ssr: false,
});

export const activeChain = ACTIVE_ENV === 'testnet' ? baseSepolia : base;
