import { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useRfq, useOmniston } from '@ston-fi/omniston-sdk-react';
import type { InvoiceState, AffiliateInvoiceState } from '../utils/codec';

export type DeltaState =
  | 'HYDRATING'
  | 'ROUTE_STREAM'
  | 'LOCKING_EVM'
  | 'SWAP_SETTLING'
  | 'SUCCESS_VALEDICTORY';

export type SettlementLog = {
  ts: number;
  msg: string;
  type: 'info' | 'success' | 'warn';
};

export function useDeltaEngine(
  invoice: InvoiceState | null,
  affiliateData: AffiliateInvoiceState | null,
  connectedEvmAddress?: string,
  sourceNetwork: string = 'Base (USDC)',
  userBuffer: number = 55.00,
  isSimulation: boolean = true
) {
  const [state, setState] = useState<DeltaState>('ROUTE_STREAM');
  const [log, setLog] = useState<SettlementLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const omniston = useOmniston();

  const addLog = (msg: string, type: SettlementLog['type'] = 'info') => {
    setLog(prev => [...prev, { ts: Date.now(), msg, type }]);
  };

  const invoiceAmount = invoice ? parseFloat(invoice.amount) : 50.00;

  // React SDK Real RFQ Hook (Only enabled when NOT simulating)
  const rfq = useRfq({
    settlementMethods: [0], // SETTLEMENT_METHOD_SWAP
    bidAssetAddress: {
      blockchain: 0, // Blockchain.TON
      address: '', // native TON
    },
    askAssetAddress: {
      blockchain: 0, // Blockchain.TON
      address: 'EQCxE6mUoGEyB7j9meA_3O9CgjWb8A1mYb9bA1b7Doo2Tok', // USD₮
    },
    amount: {
      $case: 'bidUnits',
      value: (invoiceAmount * 1e9).toString() // Native TON amount
    },
    settlementParams: {
      maxPriceSlippageBps: 500,
      gaslessSettlement: 0,
      maxOutgoingMessages: 4,
      flexibleReferrerFee: true,
    } as any
  } as any, { enabled: !isSimulation && !!wallet });

  useEffect(() => {
    if (!isSimulation) {
      if (rfq.isLoading) addLog('Requesting live sandbox quote...', 'info');
      if (rfq.data?.quote) addLog(`Quote acquired! ID: ${rfq.data.quote.quoteId}`, 'success');
      if (rfq.error) addLog(`RFQ Error: ${rfq.error.message}`, 'warn');
    }
  }, [rfq.isLoading, rfq.data?.quote, rfq.error, isSimulation]);

  const executePayment = async () => {
    if (isSimulation) {
      setError('Live execution fallback removed as per architectural review. Please switch to Live Sandbox and connect TON wallet.');
      return;
    }

    if (!wallet) {
      setError('Please connect your TON wallet to execute the real Sandbox swap.');
      return;
    }

    if (!rfq.data?.quote) {
      setError('No valid quote available from Sandbox Resolvers yet.');
      return;
    }

    setState('SWAP_SETTLING');
    addLog('Building Omniston TON Swap Payload...', 'info');

    try {
      // Real React SDK Build Transfer
      const tx = await omniston.tonBuildSwap({
        quote: rfq.data.quote,
        sourceAddress: { blockchain: 0, address: wallet.account.address } as any,
        destinationAddress: { blockchain: 0, address: invoice?.merchant || wallet.account.address } as any,
        gasExcessAddress: { blockchain: 0, address: wallet.account.address } as any,
        refundAddress: { blockchain: 0, address: wallet.account.address } as any,
        useRecommendedSlippage: false,
      } as any);

      addLog('Please sign the transaction in your TON wallet...', 'info');

      await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 1000000,
        messages: [{
          address: tx.address,
          amount: tx.amount,
          payload: tx.payload
        }]
      });

      addLog('Swap successfully executed on Sandbox!', 'success');
      setState('SUCCESS_VALEDICTORY');
      
    } catch (err: any) {
      console.error(err);
      setError(`Settlement Failed: ${err.message || 'Transaction rejected'}`);
      setState('ROUTE_STREAM');
    }
  };

  return {
    state,
    metrics: {
      requiredInputUsdc: invoiceAmount.toFixed(2),
      residualGas: '0.00',
      gasSponsorDeduction: '0.00',
      quoteId: rfq.data?.quote?.quoteId || '',
      slippageBps: 500,
      routeHops: ['TON Native', 'Omniston HTLC', 'TON USD₮'],
    },
    log,
    error,
    isGasless: false,
    isAffiliate: !!affiliateData,
    affiliateCommissionUsdt: '0.00',
    residualRoute: 'TON_WALLET' as any,
    setResidualRoute: () => {},
    executePayment,
    toggleGasless: () => {},
    tonIdentity: wallet ? { address: wallet.account.address, mnemonic: [] } : null,
  };
}
