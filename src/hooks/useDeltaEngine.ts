// src/hooks/useDeltaEngine.ts
// Core state machine: invoice hydration → Omniston RFQ → wallet generation → payment → settlement

import { useState, useEffect, useRef, useCallback } from 'react';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';
import { useSendTransaction, useSignTypedData } from 'wagmi';
import { parseEther } from 'viem';
import { Omniston } from '@ston-fi/omniston-sdk';
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

// ─── Ephemeral TON wallet generator ─────────────────────────────────────────────

// ─── Omniston RFQ simulation ──────────────────────────────────────────────────

const simulateOmnistonStream = async (
  invoiceAmount: number,
  userBuffer: number,
  isGasless: boolean,
  isAffiliate: boolean,
  sourceNetwork: string,
  _tonAddress: string,
  addLog: (msg: string, type: SettlementLog['type']) => void,
  onQuote: (m: OmnistonMetrics) => void,
  isSimulation: boolean
): Promise<void> => {
  addLog('Initializing Omniston Sandbox Client...', 'info');
  
  // 1. Initialize the live Sandbox Client
  const omniston = new Omniston({ apiUrl: 'wss://omni-ws.ston.fi' });
  
  addLog('Connected to wss://omni-ws.ston.fi (MAINNET)', 'success');
  await new Promise(r => setTimeout(r, 600));

  let realQuoteId = '';
  try {
    addLog('Requesting LIVE cross-chain RFQ from Mainnet Resolvers...', 'info');
    // Map the selected UI network to its actual Mainnet EVM contract address
    let actualSourceAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Default Base USDC
    if (sourceNetwork.includes('Polygon')) {
      actualSourceAddress = '0xc011a7e12a19f7b1f670d46f03b03f3342e82dfb'; // Polygon pUSD
    } else if (sourceNetwork.includes('Ethereum')) {
      actualSourceAddress = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // Ethereum USDT
    } else if (sourceNetwork.includes('BNB')) {
      actualSourceAddress = '0x55d398326f99059fF775485246999027B3197955'; // BNB USDT
    }

    // Request the real quote observable using exact v1beta8 schema
    const quoteObservable = omniston.requestForQuote({
      inputAsset: { chain: { $case: 'base', value: { kind: { $case: 'erc20', value: actualSourceAddress } } } },
      outputAsset: { chain: { $case: 'ton', value: { kind: { $case: 'jetton', value: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs' } } } },
      amount: { $case: 'inputUnits', value: (invoiceAmount * 1e6).toFixed(0) },
      settlementParams: [{ params: { $case: 'order', value: {} } }]
    } as any);

    // Extract the first quote ID
    const realQuote = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for STON.fi quotes after 8s')), 8000);
      quoteObservable.subscribe({
        next: (event: any) => {
          if (event && event.$case === 'quoteUpdated' && event.value) {
            clearTimeout(timeout);
            resolve(event.value);
          }
        },
        error: (err: any) => {
          console.error("Quote Observable Error:", err);
          clearTimeout(timeout);
          reject(err);
        }
      });
    });

    realQuoteId = realQuote.quoteId;
    addLog(`Live Mainnet Quote Captured: ${realQuoteId}`, 'success');
  } catch (err: any) {
    if (!isSimulation) {
      const errDetails = err.details || JSON.stringify(err);
      addLog(`Mainnet quote fetch failed: ${err.message}. Details: ${errDetails}`, 'warn');
      throw new Error(`Live execution failed: ${err.message}. Details: ${errDetails}`);
    }
    console.error("Mainnet Quote Fetch Failed:", err);
    addLog('Quote stream timeout or error. Simulating execution fallback...', 'info');
    await new Promise(r => setTimeout(r, 800));
  }

  if (!isSimulation && !realQuoteId) {
    throw new Error('Failed to acquire live mainnet quote.');
  }

  if (!isSimulation && realQuote) {
    const inputAmount = parseFloat(realQuote.inputUnits || '0') / 1e6;
    const gasSponsor = isGasless ? 0.42 : 0;
    const residual = Math.max(0, userBuffer - inputAmount - gasSponsor);
    
    const metrics: OmnistonMetrics = {
      requiredInputUsdc: inputAmount.toFixed(2),
      residualGas: residual.toFixed(2),
      gasSponsorDeduction: gasSponsor.toFixed(2),
      quoteId: realQuote.quoteId,
      slippageBps: 0,
      routeHops: ['Live Omniston Route Detected'],
    };
    onQuote(metrics);
    addLog(`Optimal live quote locked — awaiting user authorization`, 'success');
    return;
  }

  // --- MOCK SIMULATION LOGIC ---
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

    const sourceAsset = sourceNetwork.includes('USDC') ? 'USDC' : sourceNetwork.includes('pUSD') ? 'pUSD' : 'USD₮';
    const sourceChain = sourceNetwork.split(' ')[0];

    const metrics: OmnistonMetrics = {
      requiredInputUsdc: requiredInput.toFixed(2),
      residualGas: residual.toFixed(2),
      gasSponsorDeduction: gasSponsor.toFixed(2),
      quoteId: `QT-${Date.now().toString(36).toUpperCase()}-${i}`,
      slippageBps: q.slippage,
      routeHops: i < 2
        ? [`${sourceChain} ${sourceAsset} → WETH`, 'WETH → STON.fi Relay', 'jUSDT → USD₮ (TON)']
        : [`${sourceChain} ${sourceAsset} → USD₮ (TON)`, 'Direct HTLC Escrow'],
    };

    onQuote(metrics);
    addLog(
      `Quote #${i + 1}: input=${metrics.requiredInputUsdc} ${sourceAsset}, slippage=${(q.slippage / 100).toFixed(2)}%, hops=${q.hopCount}`,
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
export function useDeltaEngine(
  invoice: InvoiceState | null,
  affiliateData: AffiliateInvoiceState | null,
  connectedEvmAddress?: string,
  sourceNetwork: string = 'Base (USDC)',
  userBuffer: number = 55.00,
  isSimulation: boolean = true
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

  const { sendTransactionAsync } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();

  const addLog = useCallback((msg: string, type: SettlementLog['type'] = 'info') => {
    setLog(prev => [...prev, { ts: Date.now(), msg, type }]);
  }, []);

  const isAffiliate = !!affiliateData;
  const activeInvoice = affiliateData ?? invoice;

  const affiliateCommissionUsdt = isAffiliate && metrics.requiredInputUsdc !== '0.00'
    ? (parseFloat(metrics.requiredInputUsdc) * 0.002).toFixed(4)
    : '0.0000';

  const invoiceAmount = activeInvoice ? parseFloat(activeInvoice.amount) : 50.00;
  // Keep track of parameters to prevent infinite loops, but re-run when toggles change
  const currentReq = `${activeInvoice?.id}-${isSimulation}-${sourceNetwork}`;
  const streamRef = useRef('');

  useEffect(() => {
    if (!activeInvoice || streamRef.current === currentReq) return;
    streamRef.current = currentReq;

    let isCancelled = false;

    const safeAddLog = (msg: string, type: SettlementLog['type'] = 'info') => {
      if (!isCancelled) addLog(msg, type);
    };

    const init = async () => {
      setState('HYDRATING');
      setLog([]);
      setError(null);
      setMetrics({
        requiredInputUsdc: '0.00',
        residualGas: '0.00',
        gasSponsorDeduction: '0.00',
        quoteId: '',
        slippageBps: 0,
        routeHops: []
      });
      await new Promise(r => setTimeout(r, 400));

      const mnemonic = await mnemonicNew(24);
      const keyPair = await mnemonicToPrivateKey(mnemonic);
      const wallet = WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey });
      const address = wallet.address.toString({ bounceable: false });
      
      if (isCancelled) return;
      setTonIdentity({ address, mnemonic });

      safeAddLog('Ephemeral TON keypair generated (browser-native)', 'success');
      safeAddLog(`Address: ${address.slice(0, 12)}…${address.slice(-8)}`, 'info');

      if (isCancelled) return;
      setState('ROUTE_STREAM');

      await simulateOmnistonStream(
        invoiceAmount,
        userBuffer,
        isGasless,
        isAffiliate,
        sourceNetwork,
        address,
        safeAddLog,
        m => { if (!isCancelled) setMetrics(m); },
        isSimulation
      );
    };

    init().catch(err => {
      if (!isCancelled) {
        setError(err.message ?? 'Initialisation failed');
        setState('ROUTE_STREAM');
      }
    });

    return () => {
      isCancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeInvoice, isSimulation, sourceNetwork]);

  // Re-calc residual when gasless or userBuffer toggled
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
  }, [isGasless, userBuffer]);

  const executePayment = async () => {
    if (state !== 'ROUTE_STREAM') return;
    setState('LOCKING_EVM');
    addLog('Please confirm the transaction in your wallet...', 'info');

    let txHash: string | undefined;
    try {
      if (isSimulation) {
        txHash = await sendTransactionAsync({
          to: '0x000000000000000000000000000000000000dEaD', // Burn/vault address for the demo
          value: parseEther('0.0001'),
        });
        addLog(`Real EVM transaction submitted: ${txHash.slice(0,10)}…`, 'success');
      } else {
        addLog('Attempting Live STON.fi payload construction...', 'info');
        const omniston = new Omniston({ apiUrl: 'wss://omni-ws.ston.fi' });
        
        let signature: string;
        try {
          // This attempts the real SDK EVM execution path.
          const payloadRes = await omniston.evmBuildOrderPayload({
             quoteId: metrics.quoteId,
             ownerSrcAddress: { chain: { $case: 'base', value: connectedEvmAddress || '' } },
             traderDstAddress: { chain: { $case: 'ton', value: tonIdentity?.address || '' } }
          } as any);

          addLog('Please sign the TypedData in MetaMask...', 'info');
          const typedData = JSON.parse(payloadRes.typedData);
          signature = await signTypedDataAsync({
            domain: typedData.domain,
            types: typedData.types,
            primaryType: typedData.primaryType,
            message: typedData.message
          });
        } catch (apiErr: any) {
          console.error("Omniston evmBuildOrderPayload failed:", apiErr);
          const errMsg = apiErr.message || 'API rejected payload construction';
          addLog(`Mainnet payload construction failed: ${errMsg}`, 'warn');
          throw new Error(`STON.fi API Error: ${errMsg}`);
        }

        addLog('Registering Signed Order with Omniston...', 'info');
        await omniston.registerSignedOrder({
           quoteId: metrics.quoteId,
           ownerSrcAddress: { chain: { $case: 'base', value: connectedEvmAddress || '' } },
           signedOrder: { value: signature } 
        } as any);
        addLog('Order successfully registered with STON.fi resolvers!', 'success');
      }
    } catch (err: any) {
      console.error("Live Execution Error:", err);
      const errMsg = err?.message || err?.toString() || 'Wallet transaction rejected';
      setError(`Execution Failed: ${errMsg}`);
      setState('ROUTE_STREAM');
      return;
    }

    if (residualRoute === 'EVM_RETURN') {
      addLog(`Residual will be returned to EVM: ${connectedEvmAddress ? connectedEvmAddress.slice(0,10) + '…' : 'connected wallet'}`, 'info');
    } else {
      addLog('Residual will seed a new TON wallet', 'info');
    }

    await new Promise(r => setTimeout(r, 600));
    setState('SWAP_SETTLING');

    if (!isSimulation) {
      addLog('Waiting for STON.fi resolvers to complete HTLC relay...', 'info');
      await new Promise(r => setTimeout(r, 2000));
      addLog('Mainnet tracking unavailable in this environment. Order pending.', 'warn');
      setState('SUCCESS_VALEDICTORY');
      return;
    }

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
