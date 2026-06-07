# STN-Delta ⚡

**One-liner:** The cross-chain payment gateway that captures every dollar.

**Short Description:** 
STN-Delta is a B2B payment gateway that allows EVM users to pay corporate invoices using stablecoins on their native chain (e.g. Base USDC) while merchants instantly receive yield-bearing USD₮ on TON. Built entirely on top of STON.fi's Omniston protocol for zero-slippage atomic settlement without the user ever touching a centralized bridge.

**Live Product URL:** https://stndelta.vercel.app
**Loom Demo:** [Add your Loom URL here]
**GitHub Repo:** [Add your GitHub URL here]

### 🛠 Tech Stack & Integrations
* **Frontend:** React, Vite, TypeScript
* **TON Ecosystem:** STON.fi Omniston SDK, TON Connect UI
* **EVM Ecosystem:** Wagmi, Viem, RainbowKit
* **AI Tools Used:** Gemini, Claude

### 💡 How it Works
1. **Invoice Creation:** Merchants generate a payment link on TON requesting a specific amount of USD₮.
2. **EVM Funding:** The customer clicks the link and connects their EVM wallet (e.g. MetaMask on Base).
3. **Omniston Routing:** The app uses the `@ston-fi/omniston-sdk` to fetch real-time RFQ routes across the Omniston network.
4. **Atomic Swap:** The user executes the transaction via an HTLC. STON.fi Resolvers detect the EVM lock and release the required USD₮ directly into the merchant's TON wallet.
5. **Residual Yield:** Any leftover slippage buffer is automatically routed back to the user or used to sponsor gasless TON onboarding.

### 🏃‍♂️ Running Locally
```bash
npm install
npm run dev
```
