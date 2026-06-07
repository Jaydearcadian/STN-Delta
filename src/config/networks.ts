// src/config/networks.ts
// All testnet + mainnet endpoint configs for STN-Delta
// Switch ACTIVE_ENV to 'mainnet' when ready to go live

export type NetworkEnv = 'testnet' | 'mainnet';

export const ACTIVE_ENV: NetworkEnv = 'testnet'; // ← flip to 'mainnet' for production

// ─── TON Network ──────────────────────────────────────────────────────────────

export const TON_CONFIG = {
  testnet: {
    name: 'TON Testnet',
    rpcUrl: 'https://testnet.toncenter.com/api/v2',
    // Get free testnet API key: https://t.me/tonapibot
    apiKey: import.meta.env.VITE_TON_TESTNET_API_KEY ?? '',
    explorerUrl: 'https://testnet.tonscan.org',
    faucetUrl: 'https://t.me/testgiver_ton_bot', // Free testnet TON
    chainId: -3, // TON testnet workchain
    assets: {
      USDT: 'EQBqSpvo4S87mkbdd6HZaHaRzXAHpEpQeV4GXWB5zTQJl-ej', // testnet jUSDT
      STON: 'EQDqkxARKFT9GtmVtNMaIhKzNnoAQ-gGa_FWaHRLYbGnMoJn', // testnet STON
    },
  },
  mainnet: {
    name: 'TON Mainnet',
    rpcUrl: 'https://toncenter.com/api/v2',
    // Get API key: https://t.me/tonapibot
    apiKey: import.meta.env.VITE_TON_MAINNET_API_KEY ?? '',
    explorerUrl: 'https://tonscan.org',
    faucetUrl: null,
    chainId: 0, // TON mainnet workchain
    assets: {
      USDT: 'EQCxE6mUoGEyB7j9meA_3O9CgjWb8A1mYb9bA1b7Doo2Tok', // mainnet jUSDT
      STON: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmgikjqEl', // mainnet STON
    },
  },
} as const;

// ─── EVM Network (Base) ───────────────────────────────────────────────────────

export const EVM_CONFIG = {
  testnet: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: import.meta.env.VITE_BASE_SEPOLIA_RPC ?? 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    faucetUrl: 'https://www.coinbase.com/faucets/base-ethereum-goerli-faucet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    assets: {
      USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    },
  },
  mainnet: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: import.meta.env.VITE_BASE_MAINNET_RPC ?? 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    faucetUrl: null,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    assets: {
      USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base mainnet USDC
    },
  },
} as const;

// ─── STON.fi / Omniston ───────────────────────────────────────────────────────

export const OMNISTON_CONFIG = {
  testnet: {
    wsUrl: 'wss://omni-ws.ston.fi', // Omniston testnet (same endpoint, uses testnet assets)
    restUrl: 'https://api.ston.fi/v1',
    referrerFeeBps: 20,
    // Testnet router: https://docs.ston.fi/developer-section/testnet
    routerAddress: 'EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n',
  },
  mainnet: {
    wsUrl: 'wss://omni-ws.ston.fi',
    restUrl: 'https://api.ston.fi/v1',
    referrerFeeBps: 20,
    routerAddress: 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt',
  },
} as const;

// ─── HTLC / Bridge ────────────────────────────────────────────────────────────

export const BRIDGE_CONFIG = {
  testnet: {
    // Orbiter Finance Base Sepolia → TON testnet
    orbiterEndpoint: 'https://openapi.orbiter.finance',
    orbiterChainId: 84532,
    // Layerswap Base Sepolia → TON testnet
    layerswapEndpoint: 'https://api.layerswap.io/api',
  },
  mainnet: {
    orbiterEndpoint: 'https://openapi.orbiter.finance',
    orbiterChainId: 8453,
    layerswapEndpoint: 'https://api.layerswap.io/api',
  },
} as const;

// ─── TON Connect ──────────────────────────────────────────────────────────────

export const TONCONNECT_MANIFEST_URL = 'https://stndelta.vercel.app/tonconnect-manifest.json';

// ─── WalletConnect (RainbowKit) ───────────────────────────────────────────────

// Get a free project ID at https://cloud.walletconnect.com
export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'stn_delta_dev_placeholder';

// ─── Active network helpers ───────────────────────────────────────────────────

export const activeTon    = TON_CONFIG[ACTIVE_ENV];
export const activeEvm    = EVM_CONFIG[ACTIVE_ENV];
export const activeOmni   = OMNISTON_CONFIG[ACTIVE_ENV];
export const activeBridge = BRIDGE_CONFIG[ACTIVE_ENV];

export const isTestnet = ACTIVE_ENV === 'testnet';
