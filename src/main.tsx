import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import App from './App.tsx'
import { wagmiConfig } from './config/wagmi'
import { TONCONNECT_MANIFEST_URL, activeOmni } from './config/networks'
import { OmnistonProvider } from '@ston-fi/omniston-sdk-react'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#22d3ee',
          accentColorForeground: '#020617',
          borderRadius: 'small',
          fontStack: 'system',
        })}>
          <TonConnectUIProvider manifestUrl={TONCONNECT_MANIFEST_URL}>
            <OmnistonProvider apiUrl={activeOmni.wsUrl}>
              <App />
            </OmnistonProvider>
          </TonConnectUIProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
