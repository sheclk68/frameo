# 🚀 FrameOS — Farcaster Mini App Hub

A multi-chain Mini App built for Farcaster. Swap tokens, launch coins, vote on polls — all inside Warpcast.

**Live:** [frameos.sheclk0068.workers.dev](https://frameos.sheclk0068.workers.dev)

---

## ✨ Features

| Module | Description | Chains |
|--------|-------------|--------|
| 🔄 **Swap** | Real DEX routing — 0x Protocol (EVM) + Jupiter (Solana) | 8 chains |
| 🚀 **Token Launch** | Clanker (auto Uniswap V4 pool), Standard ERC-20, SPL | Base · Solana · All EVM |
| 📊 **Polls** | Create, vote, real-time counts via Supabase | — |
| 🧠 **Options Vault** | P/N split vault — Vitalik's options-based DeFi concept | Contract ready |
| 🔔 **Notifications** | Welcome alerts, swap confirmations, announcements | — |
| 🖼️ **OG Image** | Dynamic open-graph preview for social sharing | — |

### Supported Chains

| Chain | Swap | Token Launch |
|-------|------|-------------|
| ⚡ Base | ✅ 0x Protocol | ✅ Clanker / Standard |
| 🌙 Solana | ✅ Jupiter | ✅ SPL Token |
| 💎 Ethereum | ✅ 0x Protocol | ✅ Standard |
| 🟡 BNB Chain | ✅ 0x Protocol | ✅ Standard |
| 🟣 Polygon | ✅ 0x Protocol | ✅ Standard |
| 🔵 Arbitrum | ✅ 0x Protocol | ✅ Standard |
| 🟠 Optimism | ✅ 0x Protocol | ✅ Standard |
| 🔴 Avalanche | ✅ 0x Protocol | ✅ Standard |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Turbopack) |
| Blockchain | viem + 0x Protocol + Jupiter + custom contracts |
| Wallet | Farcaster Mini App SDK + MetaMask + Phantom (unified) |
| Backend | Supabase (12 tables, RLS-enabled) |
| Styling | Tailwind CSS 4, glass-morphism dark UI |
| Deploy | Vercel + Cloudflare Workers proxy |
| Multi-chain | 8 chains (EVM + Solana) |

---

## 🏗️ Architecture

```
Warpcast → Cloudflare Worker → Vercel (Next.js) → Supabase
                        ↑
              Adds CSP headers for iframe embedding

       ┌─────────────────────────────────────────┐
       │  EVM (MetaMask/Rabby)    Solana (Phantom) │
       │     ↕ 0x API                ↕ Jupiter API │
       │  7 EVM chains              Solana mainnet │
       └─────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx               # Home with user stats, announcements
│   ├── layout.tsx             # Root layout + Farcaster meta tags
│   ├── opengraph-image.tsx    # Dynamic OG image (edge runtime)
│   ├── swap/page.tsx          # 8-chain swap (0x + Jupiter)
│   ├── token-launch/page.tsx  # Clanker / ERC-20 / SPL deployment
│   ├── polls/page.tsx         # Voting system
│   ├── notifications/page.tsx # Notification center
│   ├── options/page.tsx       # Options Vault (P/N split concept)
│   ├── splash/route.tsx       # Splash screen OG image
│   └── api/webhook/route.ts   # Farcaster frame events
├── hooks/
│   ├── useWallet.ts           # EVM wallet (MetaMask/Rabby/Farcaster)
│   ├── useSolanaWallet.ts     # Solana wallet (Phantom/Backpack)
│   └── useWalletManager.ts    # Unified wallet manager (switch EVM/Solana)
├── components/
│   ├── wallet-status-bar.tsx  # Wallet status + switch button
│   ├── wallet-selector.tsx    # Wallet connection modal
│   ├── swap-error-boundary.tsx# Error boundary for Swap page
│   └── toast.tsx              # Toast notifications
├── lib/
│   ├── swap.ts                # 0x API client, chain config, tokens (8 chains)
│   ├── swap-solana.ts         # Jupiter API client (Solana swaps)
│   ├── clanker.ts             # Clanker SDK integration
│   ├── token-launch-solana.ts # SPL token creation
│   ├── options-vault.ts       # Options Vault contract interface
│   ├── options-abi.ts         # Options contract ABI
│   ├── supabase-client.ts     # Browser Supabase client
│   ├── supabase-server.ts     # Server Supabase client
│   └── types.ts               # Shared TypeScript types
├── contracts/
│   ├── FrameToken.sol         # ERC-20 contract (self-contained)
│   ├── FrameFactory.sol       # Token factory (deploy once, create many)
│   ├── OptionsVault.sol       # P/N split vault (Vitalik's proposal)
│   ├── FrameFactory.json      # Compiled factory ABI + bytecode
│   └── out/                   # Compiled artifacts
```

---

## 🚀 Getting Started

```bash
git clone https://github.com/sheclk68/frameo.git
cd frameo
npm install
cp .env.example .env.local  # configure Supabase & Neynar keys
npm run dev                  # http://localhost:3000
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEYNAR_API_KEY=
```

### Deploy

```bash
npx vercel --prod
npx wrangler deploy
```

---

## 📄 License

MIT
