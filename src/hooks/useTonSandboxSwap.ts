import { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useRfq, useOmniston } from '@ston-fi/omniston-sdk-react';

export function useTonSandboxSwap(amount: number, merchantAddress: string, isEnabled: boolean) {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const omniston = useOmniston();
  const [state, setState] = useState<'IDLE' | 'FETCHING' | 'READY' | 'EXECUTING' | 'SUCCESS'>('IDLE');
  
  const rfq = useRfq({
    settlementMethods: [0], // SETTLEMENT_METHOD_SWAP
    bidAssetAddress: {
      blockchain: 0, // Blockchain.TON
      address: '', // native TON
    },
    askAssetAddress: {
      blockchain: 0, // Blockchain.TON
      address: 'EQCxE6mUoGEyB7j9meA_3O9CgjWb8A1mYb9bA1b7Doo2Tok', // jUSDT
    },
    amount: {
      $case: 'bidUnits',
      value: (amount * 1e9).toString() // assuming TON -> jUSDT
    },
    settlementParams: {
      maxPriceSlippageBps: 500,
      gaslessSettlement: 0,
      maxOutgoingMessages: 4,
      flexibleReferrerFee: true,
    } as any
  } as any, { enabled: isEnabled });

  const execute = async () => {
    if (!rfq.data?.quote || !wallet) return;
    setState('EXECUTING');
    try {
      const tx = await omniston.tonBuildSwap({
        quote: rfq.data.quote,
        sourceAddress: { blockchain: 0, address: wallet.account.address } as any,
        destinationAddress: { blockchain: 0, address: merchantAddress } as any,
        useRecommendedSlippage: false,
      } as any);

      await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 1000000,
        messages: [{
          address: tx.address,
          amount: tx.amount,
          payload: tx.payload
        }]
      });
      setState('SUCCESS');
    } catch (e) {
      console.error(e);
      setState('READY');
    }
  };

  return { rfq, state, execute };
}
