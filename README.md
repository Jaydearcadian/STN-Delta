# STN-Delta ◬
**Zero-Waste Cross-Chain Payments & Yield Routing.**
Powered by STON.fi's Omniston Protocol.

🌐 **Live App:** [https://stndelta.vercel.app](https://stndelta.vercel.app)

STN-Delta is a seamless cross-chain payment gateway that bridges EVM liquidity to the TON ecosystem. It allows merchants to generate stateless invoices for USD₮ on TON, while allowing users to instantly pay those invoices using their existing EVM wallets (Base, Polygon, Ethereum) without ever needing to bridge assets or download new apps.

## 🌟 The "Zero Waste" Innovation (Delta Routing)
Cross-chain swaps typically require users to slightly over-provision funds to account for network slippage and gas. This usually leaves users with annoying fractional capital ("dust") stranded across random networks.

STN-Delta eliminates this friction through **Residual Delta Routing**. The protocol mathematically captures the leftover buffer from a cross-chain payment and allows the user to either:
1. **EVM Yield Return:** Automatically route the unspent dust back to their origin EVM wallet.
2. **Instant TON Onboarding:** Convert the residual dust into native TON tokens, using it to instantly seed a freshly generated, browser-native TON wallet—giving them the gas they need for immediate, smooth network participation.

We turn payment waste into user acquisition.

---

## 💡 How it Works

1. **Invoice Creation:** Merchants generate a payment link on TON requesting a specific amount of USD₮.
2. **EVM Funding:** The customer clicks the link and connects their EVM wallet (e.g. MetaMask on Base).
3. **Omniston Routing:** The app uses the `@ston-fi/omniston-sdk` to fetch real-time RFQ routes across the Omniston network.
4. **Atomic Swap:** The user executes the transaction via an HTLC. STON.fi Resolvers detect the EVM lock and release the required USD₮ directly into the merchant's TON wallet.
5. **Residual Yield:** Any leftover slippage buffer is automatically routed back to the user or used to sponsor gasless TON onboarding.

---

## 🌍 Real-Life Use Cases

### 1. The Group Split (Cross-Chain Friends)
Imagine you and your friends are pooling money to pay for a shared vacation or a dinner bill. You're a TON enthusiast and want the final pool to settle in USD₮ on TON. But your friends have their capital scattered across different EVM chains like Base and Polygon. 
Normally, they'd have to find a cross-chain DEX, pay bridging fees, and download a TON wallet. Through STN-Delta's **Group Split** mode, you can generate a custom payment link for *each specific person* encoding their exact portion of the bill. You drop the link in the group chat, they connect their existing MetaMask, and the STON.fi resolvers instantly settle the cross-chain transaction.

### 2. The Borderless Freelancer
A freelancer working globally wants to accept payments entirely in TON ecosystem USD₮ to avoid high banking fees. By generating a solo STN-Delta invoice link, clients from around the world can pay their invoices using their familiar USDC on Base or Ethereum, while the freelancer receives the exact requested amount on TON via trustless HTLC atomic swaps.

### 3. The Affiliate Network
Platforms embedding the STN-Delta gateway can utilize the integrated **Affiliate Mode**, automatically appending a transparent `0.2%` commission fee (routed via Omniston's `referrerFeeBps` protocol) to every generated invoice link, creating instant monetization for B2B integrators.

---

## 🛠 Tech Stack & Integrations

- **Frontend:** React, Vite, TypeScript
- **TON Ecosystem:** STON.fi Omniston SDK, TON Connect UI
- **EVM Ecosystem:** Wagmi, Viem, RainbowKit
- **AI Tools Used:** Gemini, Claude

---

## ⚙️ How We Integrated STON.fi (v1beta8)
STN-Delta is aggressively future-proofed, built directly against the bleeding-edge **Omniston `v1beta8` Protobuf SDK**. We completely abstracted the complexity of cross-chain Atomic Swaps into a 1-click UX.

* **Live RFQ Websocket Stream (`wss://omni-ws.ston.fi`):** The engine subscribes to the STON.fi resolver network to fetch optimal, real-time cross-chain liquidity routes.
* **HTLC Payload Generation:** We integrated Omniston's `evmBuildOrderPayload`, specifically leveraging backend-generated HTLC secrets (`htlcSecrets: { secretMode: { $case: 'generated' } }`) so that STON.fi securely manages the preimage hashes for the atomic swap.
* **EIP-712 Intent Registration:** The app unpacks standard EVM ECDSA signatures (from viem/wagmi), converts the hex strings to `Uint8Array`, and packages them into the strict `SignedOrderEvmV1` structure required by the STON.fi resolvers.

---

## 🧪 Simulation vs. Live Mainnet (Developer Ready)
Because the Omniston cross-chain network is actively rolling out, we built STN-Delta to be both an interactive showcase today and a production-ready gateway tomorrow. 

The application features a strict, architecturally decoupled toggle in the UI:
* **`SIMULATION MODE`:** Provides a perfectly mocked UX environment. It fakes the observable streams, mocks the STON.fi quotes, and processes mock transactions. This allows judges, merchants, and users to safely experience the full UI flow and visual aesthetic without spending real capital.
* **`LIVE MAINNET`:** When toggled, the app instantly switches to production mode. It clears all simulated states, strictly mounts the live STON.fi `wss://omni-ws.ston.fi` WebSocket, validates real cross-chain RFQs, and executes genuine EIP-712 payload registrations. 

This dual-state architecture means STN-Delta is **ready to plug-and-play** the second the Omniston cross-chain resolvers are fully operational.

---

## 🏗 Zero-Backend Architecture
STN-Delta requires **no backend database**. We built a custom **Stateless Base64 URL Codec** (`btoa`/`atob`). The entire state of an invoice—merchant address, settlement amount, network limits, and group split math—is cryptographically compressed and serialized directly into the URL query parameters. The payment link itself *is* the database.

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
