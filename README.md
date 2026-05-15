# ⛓️ Silverway — The Native AMM & DEX on LitVM

**Silverway** is a next-generation decentralized exchange (DEX) and automated market maker (AMM) built exclusively for the **Litecoin Virtual Machine (LitVM) LiteForge Testnet**.

Designed with a premium, minimalist "Apple-style" Carbon Black and Neon Silver aesthetic, Silverway focuses on providing users with a frictionless, highly responsive, and precision-driven trading experience for Litecoin-native assets.

🔗 **Live Application:** <https://silverway-lit-vm.vercel.app/>

## ✨ Core Features

### 💱 Precision Swaps

* Seamlessly trade LitVM assets (e.g., `zkLTC`, `USDC`) with a highly optimized routing interface.

* Adjustable slippage tolerance (0.1%, 0.5%, 1%, or custom).

* Real-time token registry and price fetching simulation.

### 🔌 Web3 & Network Integration

* **Ethers.js (v6) Powered:** Robust backend-ready logic for wallet connections and contract interactions.

* **One-Click Network Setup:** Automatically prompts users to add the `LitVM LiteForge` testnet to their MetaMask via `wallet_addEthereumChain` directly from the UI.

* Integrated **Caldera Faucet** shortcut to easily fund testnet wallets.

### 🎨 Premium UI/UX Engineering

* **Custom Apple-style Design Tokens:** Carefully crafted CSS variables in `index.css` featuring an immersive Carbon Black theme.

* **Advanced Animations:** Includes custom `@keyframes` for chrome-spinning rings, glowing gradients, floating elements, and smooth fade-ups.

* **Typography:** Utilizing the modern `Geist` and `Geist Mono` font families for maximum readability and sleekness.

* **Toasts & Notifications:** Interactive and elegant notifications powered by `Sonner`.

### 📊 Ecosystem Ready

* Multi-route architecture structured for expansion:

  * **`/` (Swap):** The main AMM interface.

  * **`/pools`:** Liquidity provision dashboard.

  * **`/stats`:** Network and token analytics.

  * **`/portfolio`:** User asset management.

## 🌐 Network & Contract Details

Silverway is currently deployed and configured for the **LitVM LiteForge Testnet**.

### Network Parameters

| Property | Value | 
 | ----- | ----- | 
| **Network Name** | LitVM LiteForge | 
| **RPC URL** | `https://liteforge.rpc.caldera.xyz/http` | 
| **Chain ID** | `4441` (`0x1159` in hex) | 
| **Currency Symbol** | `zkLTC` | 
| **Block Explorer** | [LiteForge Explorer](https://liteforge.explorer.caldera.xyz) | 

### Smart Contracts

| Contract | Address | 
 | ----- | ----- | 
| **DEX Universal Router** | `0x644Bae19C0b65D733A48a0C1EAA45C49559Bdd5A` | 

## 🛠️ Technical Architecture

This application is built with modern, high-performance web technologies:

* **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) for lightning-fast HMR and building.

* **Styling:** [Tailwind CSS](https://tailwindcss.com/) configured with custom CSS variables and utility classes.

* **Components:** [Radix UI](https://www.radix-ui.com/) primitives + [shadcn/ui](https://ui.shadcn.com/) for accessible, unstyled components.

* **Icons:** [Lucide React](https://lucide.dev/)

* **Web3:** [Ethers.js v6](https://docs.ethers.org/v6/)

* **Notifications:** [Sonner](https://sonner.emilkowal.ski/)

* **Deployment:** [Vercel](https://vercel.com/)

## 🚀 Getting Started (Local Development)

To run Silverway locally on your machine, follow these steps:

### 1. Clone the repository

```
git clone [https://github.com/delreyir/SilverwayLitVM.git](https://github.com/delreyir/SilverwayLitVM.git)
cd SilverwayLitVM
```

### 2. Install dependencies

```
npm install
```

### 3. Start the development server

```
npm run dev
```

### 4. Build for production

```
npm run build
```

Open your browser and navigate to `http://localhost:5173` to see the app running.

## 🤝 Contributing

Contributions, issues, and feature requests are highly welcome! We are actively building out the Pools, Stats, and Portfolio interfaces.
Feel free to check the [issues page](https://github.com/delreyir/SilverwayLitVM/issues).

## 📄 License

This project is licensed under the MIT License.
EOF
