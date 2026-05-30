# 🚀 FrameOS — Farcaster Mini App Hub

A multi-chain Mini App built for Farcaster. Swap tokens, launch coins, vote on polls — all inside Warpcast.

**Live:** [frameos.sheclk0068.workers.dev](https://frameos.sheclk0068.workers.dev)

---

## ✨ Features

| Module | Description | Chain |
|--------|-------------|-------|
| 🔄 **Swap** | Real DEX routing via 0x Protocol | Base + Arbitrum |
| 🚀 **Token Launch** | Deploy ERC-20 tokens in one click | Base + Arbitrum |
| 📊 **Polls** | Create, vote, real-time counts via Supabase | — |
| 🔔 **Notifications** | Welcome alerts, swap confirmations, announcements | — |
| 🖼️ **OG Image** | Dynamic open-graph preview for social sharing | — |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Turbopack) |
| Blockchain | viem + 0x Protocol + custom ERC-20 contracts |
| Wallet | Farcaster Mini App SDK (`@farcaster/miniapp-sdk`) |
| Backend | Supabase (8 tables, RLS-enabled) |
| Styling | Tailwind CSS 4, glass-morphism dark UI |
| Deploy | Vercel + Cloudflare Workers proxy |
| Multi-chain | Base (8453) + Arbitrum (42161) |

---

## 🏗️ Architecture

```
Warpcast → Cloudflare Worker → Vercel (Next.js) → Supabase
                        ↑
              Adds CSP headers for iframe embedding
```

---

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx               # Home with user stats, announcements
│   ├── layout.tsx             # Root layout + Farcaster meta tags
│   ├── opengraph-image.tsx    # Dynamic OG image (edge runtime)
│   ├── swap/page.tsx          # 0x DEX swap interface
│   ├── token-launch/page.tsx  # ERC-20 deployment UI
│   ├── polls/page.tsx         # Voting system
│   ├── notifications/page.tsx # Notification center
│   └── api/webhook/route.ts   # Farcaster frame events
├── hooks/
│   └── useWallet.ts           # Farcaster wallet provider hook
├── lib/
│   ├── swap.ts                # 0x API client, chain config, tokens
│   ├── supabase-client.ts     # Browser Supabase client
│   ├── supabase-server.ts     # Server Supabase client
│   └── types.ts               # Shared TypeScript types
├── contracts/
│   ├── FrameToken.sol         # ERC-20 contract (self-contained)
│   └── FrameToken.json        # Compiled ABI + bytecode
└── components/
    └── toast.tsx              # Toast notification component
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
