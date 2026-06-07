// src/hooks/useDeltaEngine.ts
// Core state machine: invoice hydration → Omniston RFQ → wallet generation → payment → settlement

import { useState, useEffect, useRef, useCallback } from 'react';
import type { InvoiceState, AffiliateInvoiceState } from '../utils/codec';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DeltaState =
  | 'HYDRATING'
  | 'ROUTE_STREAM'
  | 'LOCKING_EVM'
  | 'SWAP_SETTLING'
  | 'SUCCESS_VALEDICTORY';

// Where does the residual go after settlement?
export type ResidualRoute =
  | 'TON_WALLET'   // Generate ephemeral TON wallet, seed with gas (default)
  | 'EVM_RETURN';  // Return residual USDC to payer's connected EVM address

export type OmnistonMetrics = {
  requiredInputUsdc: string;
  residualGas: string;
  gasSponsorDeduction: string;
  quoteId: string;
  slippageBps: number;
  routeHops: string[];
};

export type TonIdentity = {
  address: string;
  mnemonic: string[];
};

export type SettlementLog = {
  ts: number;
  msg: string;
  type: 'info' | 'success' | 'warn';
};

export type DeltaEngineState = {
  state: DeltaState;
  tonIdentity: TonIdentity | null;
  metrics: OmnistonMetrics;
  log: SettlementLog[];
  error: string | null;
  isGasless: boolean;
  isAffiliate: boolean;
  affiliateCommissionUsdt: string;
  residualRoute: ResidualRoute;
  setResidualRoute: (r: ResidualRoute) => void;
  executePayment: () => Promise<void>;
  toggleGasless: () => void;
};

// ─── Mock TON mnemonic generator ─────────────────────────────────────────────

const WORD_LIST = [
  'abandon','ability','able','about','above','absent','absorb','abstract',
  'absurd','abuse','access','accident','account','accuse','achieve','acid',
  'acoustic','acquire','across','action','actor','actual','adapt','add',
  'addict','address','adjust','admit','adult','advance','advice','aerobic',
  'afford','afraid','again','agent','agree','ahead','aim','air',
  'airport','aisle','alarm','album','alcohol','alert','alien','alley',
];

const generateMockMnemonic = (): string[] =>
  Array.from({ length: 24 }, () => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);

const generateMockTonAddress = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return `UQ${Array.from({ length: 46 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`;
};

// ─── Omniston RFQ simulation ──────────────────────────────────────────────────

const simulateOmnistonStream = async (
  invoiceAmount: number,
  userBuffer: number,
  isGasless: boolean,
  isAffiliate: boolean,
  onQuote: (m: OmnistonMetrics) => void,
  addLog: (msg: string, type: SettlementLog['type']) => void
): Promise<void> => {
  addLog('Opening WebSocket to wss://omni-ws.ston.fi …', 'info');
  await new Promise(r => setTimeout(r, 400));
  addLog('Handshake complete — streaming RFQ quotes', 'info');
  await new Promise(r => setTimeout(r, 300));

  if (isAffiliate) {
    addLog('Affiliate referrer detected — 0.2% fee injected into swap', 'info');
    await new Promise(r => setTimeout(r, 200));
  }

  addLog('Requesting OUTPUT_FIXED quote (ask_units mode) …', 'info');
  await new Promise(r => setTimeout(r, 600));

  const quotes = [
    { slippage: 28, hopCount: 3 },
    { slippage: 22, hopCount: 2 },
    { slippage: 18, hopCount: 2 },
  ];

  for (let i = 0; i < quotes.length; i++) {
    await new Promise(r => setTimeout(r, 350));
    const q = quotes[i];
    const requiredInput = invoiceAmount * (1 + q.slippage / 10000) * 1.002;
    const gasSponsor = isGasless ? 0.42 : 0;
    const residual = Math.max(0, userBuffer - requiredInput - gasSponsor);

    const metrics: OmnistonMetrics = {
      requiredInputUsdc: requiredInput.toFixed(2),
      residualGas: residual.toFixed(2),
      gasSponsorDeduction: gasSponsor.toFixed(2),
      quoteId: `QT-${Date.now().toString(36).toUpperCase()}-${i}`,
      slippageBps: q.slippage,
      routeHops: i < 2
        ? ['Base USDC → WETH', 'WETH → Orbiter Bridge', 'jUSDT → USDT (TON)']
        : ['Base USDC → USDT (TON)', 'Direct HTLC Escrow'],
    };

    onQuote(metrics);
    addLog(
      `Quote #${i + 1}: input=${metrics.requiredInputUsdc} USDC, slippage=${(q.slippage / 100).toFixed(2)}%, hops=${q.hopCount}`,
      'info'
    );
  }

  addLog('Optimal quote locked — awaiting user authorization', 'success');
};

// ─── Settlement simulation ────────────────────────────────────────────────────

const simulateSettlement = async (
  isAffiliate: boolean,
  residualRoute: ResidualRoute,
  evmAddress: string | undefined,
  addLog: (msg: string, type: SettlementLog['type']) => void
): Promise<void> => {
  const steps: Array<[string, number, SettlementLog['type']]> = [
    ['EVM wallet signature captured', 300, 'info'],
    ['Broadcasting to Base L2 mempool…', 500, 'info'],
    ['HTLC contract deployed on Base (block #21,847,392)', 600, 'success'],
    ['Omniston resolver detected HTLC event', 400, 'info'],
    ['Cross-chain proof relayed to TON network', 700, 'info'],
    ['TON smart contract verifying HTLC preimage…', 800, 'info'],
    ['Invoice amount settled to merchant wallet ✓', 200, 'success'],
    ['Residual delta computed from buffer', 300, 'info'],
    ...(residualRoute === 'TON_WALLET'
      ? [
          ['Residual converted → native TON gas', 400, 'info'] as [string, number, SettlementLog['type']],
          ['Seeding new TON wallet with gas…', 500, 'info'] as [string, number, SettlementLog['type']],
        ]
      : [
          ['Residual USDC routed back to EVM address…', 400, 'info'] as [string, number, SettlementLog['type']],
          [`Residual returned to ${evmAddress ? evmAddress.slice(0,10) + '…' : 'your EVM wallet'} ✓`, 500, 'success'] as [string, number, SettlementLog['type']],
        ]
    ),
    ...(isAffiliate
      ? [['Affiliate commission (0.2%) transferred ✓', 300, 'success'] as [string, number, SettlementLog['type']]]
      : []
    ),
    ['Settlement complete — zero waste ✓', 200, 'success'],
  ];

  for (const [msg, delay, type] of steps) {
    await new Promise(r => setTimeout(r, delay));
    addLog(msg, type);
  }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_USER_BUFFER = 55.00;

export function useDeltaEngine(
  invoice: InvoiceState | null,
  affiliateData: AffiliateInvoiceState | null,
  connectedEvmAddress?: string
): DeltaEngineState {
  const [state, setState]               = useState<DeltaState>('HYDRATING');
  const [tonIdentity, setTonIdentity]   = useState<TonIdentity | null>(null);
  const [isGasless, setIsGasless]       = useState(false);
  const [residualRoute, setResidualRoute] = useState<ResidualRoute>('TON_WALLET');
  const [metrics, setMetrics]           = useState<OmnistonMetrics>({
    requiredInputUsdc: '0.00',
    residualGas: '0.00',
    gasSponsorDeduction: '0.00',
    quoteId: '',
    slippageBps: 0,
    routeHops: [],
  });
  const [log, setLog]     = useState<SettlementLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback((msg: string, type: SettlementLog['type'] = 'info') => {
    setLog(prev => [...prev, { ts: Date.now(), msg, type }]);
  }, []);

  const isAffiliate = !!affiliateData;
  const activeInvoice = affiliateData ?? invoice;

  const affiliateCommissionUsdt = isAffiliate && metrics.requiredInputUsdc !== '0.00'
    ? (parseFloat(metrics.requiredInputUsdc) * 0.002).toFixed(4)
    : '0.0000';

  const invoiceAmount = activeInvoice ? parseFloat(activeInvoice.amount) : 50.00;
  const userBuffer = DEFAULT_USER_BUFFER;
  const streamRef = useRef(false);

  useEffect(() => {
    if (!activeInvoice || streamRef.current) return;
    streamRef.current = true;

    const init = async () => {
      setState('HYDRATING');
      await new Promise(r => setTimeout(r, 400));

      const mnemonic = generateMockMnemonic();
      const address = generateMockTonAddress();
      setTonIdentity({ address, mnemonic });

      addLog('Ephemeral TON keypair generated (browser-native)', 'success');
      addLog(`Address: ${address.slice(0, 12)}…${address.slice(-8)}`, 'info');

      setState('ROUTE_STREAM');

      await simulateOmnistonStream(
        invoiceAmount,
        userBuffer,
        isGasless,
        isAffiliate,
        m => setMetrics(m),
        addLog
      );
    };

    init().catch(err => {
      setError(err.message ?? 'Initialisation failed');
      setState('ROUTE_STREAM');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInvoice]);

  // Re-calc residual when gasless toggled
  useEffect(() => {
    if (state !== 'ROUTE_STREAM' && state !== 'HYDRATING') return;
    if (!activeInvoice) return;
    const gasSponsor = isGasless ? 0.42 : 0;
    const requiredInput = invoiceAmount * 1.0027;
    const residual = Math.max(0, userBuffer - requiredInput - gasSponsor);
    setMetrics(prev => ({
      ...prev,
      gasSponsorDeduction: gasSponsor.toFixed(2),
      residualGas: residual.toFixed(2),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGasless]);

  const executePayment = async () => {
    if (state !== 'ROUTE_STREAM') return;
    setState('LOCKING_EVM');
    addLog('User authorized payment order', 'info');

    if (residualRoute === 'EVM_RETURN') {
      addLog(`Residual will be returned to EVM: ${connectedEvmAddress ? connectedEvmAddress.slice(0,10) + '…' : 'connected wallet'}`, 'info');
    } else {
      addLog('Residual will seed a new TON wallet', 'info');
    }

    await new Promise(r => setTimeout(r, 600));
    setState('SWAP_SETTLING');

    try {
      await simulateSettlement(isAffiliate, residualRoute, connectedEvmAddress, addLog);
      setState('SUCCESS_VALEDICTORY');
    } catch {
      setError('Settlement failed. Please retry.');
      setState('ROUTE_STREAM');
    }
  };

  const toggleGasless = () => {
    setIsGasless(prev => !prev);
    addLog(`Gasless mode ${!isGasless ? 'enabled' : 'disabled'}`, 'info');
  };

  return {
    state,
    tonIdentity,
    metrics,
    log,
    error,
    isGasless,
    isAffiliate,
    affiliateCommissionUsdt,
    residualRoute,
    setResidualRoute,
    executePayment,
    toggleGasless,
  };
}
