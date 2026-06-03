import { writeFileSync } from "fs";
import { Resvg } from "@resvg/resvg-js";
import { homedir } from "os";
import { join } from "path";

const W = 1280;
const H = 720;
const DESKTOP = join(homedir(), "Desktop");

function svgHome() {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d12"/>
      <stop offset="50%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8a63d2"/>
      <stop offset="100%" style="stop-color:#4a90d9"/>
    </linearGradient>
    <filter id="glow1"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="40"/></filter>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.04)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.01)"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Glows -->
  <circle cx="1180" cy="-80" r="200" fill="rgba(138,99,210,0.12)" filter="url(#glow1)"/>
  <circle cx="40" cy="620" r="160" fill="rgba(74,144,217,0.08)" filter="url(#glow2)"/>

  <!-- Header -->
  <circle cx="100" cy="100" r="36" fill="url(#logoGrad)"/>
  <text x="100" y="112" text-anchor="middle" fill="white" font-size="32" font-weight="bold" font-family="Arial,sans-serif">F</text>
  <text x="155" y="95" fill="white" font-size="48" font-weight="bold" font-family="Arial,sans-serif">FrameOS</text>
  <text x="155" y="120" fill="#8888aa" font-size="20" font-family="Arial,sans-serif">Farcaster Mini App Hub</text>

  <!-- Chain badges -->
  <rect x="900" y="76" width="80" height="36" rx="18" fill="rgba(36,186,159,0.15)"/>
  <text x="940" y="100" text-anchor="middle" fill="#24ba9f" font-size="16" font-weight="bold" font-family="Arial,sans-serif">Base</text>
  <rect x="992" y="76" width="100" height="36" rx="18" fill="rgba(42,119,214,0.15)"/>
  <text x="1042" y="100" text-anchor="middle" fill="#2a77d6" font-size="16" font-weight="bold" font-family="Arial,sans-serif">Arbitrum</text>

  <!-- Stats -->
  <g transform="translate(64, 180)">
    <rect x="0" y="0" width="278" height="100" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="139" y="35" text-anchor="middle" fill="white" font-size="28" font-family="Arial,sans-serif">🔄</text>
    <text x="139" y="65" text-anchor="middle" fill="white" font-size="32" font-weight="bold" font-family="Arial,sans-serif">100+</text>
    <text x="139" y="86" text-anchor="middle" fill="#666688" font-size="16" font-family="Arial,sans-serif">Swaps</text>

    <rect x="302" y="0" width="278" height="100" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="441" y="35" text-anchor="middle" fill="white" font-size="28" font-family="Arial,sans-serif">💰</text>
    <text x="441" y="65" text-anchor="middle" fill="white" font-size="32" font-weight="bold" font-family="Arial,sans-serif">$2.5K</text>
    <text x="441" y="86" text-anchor="middle" fill="#666688" font-size="16" font-family="Arial,sans-serif">Volume</text>

    <rect x="604" y="0" width="278" height="100" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="743" y="35" text-anchor="middle" fill="white" font-size="28" font-family="Arial,sans-serif">🗳️</text>
    <text x="743" y="65" text-anchor="middle" fill="white" font-size="32" font-weight="bold" font-family="Arial,sans-serif">500+</text>
    <text x="743" y="86" text-anchor="middle" fill="#666688" font-size="16" font-family="Arial,sans-serif">Votes</text>

    <rect x="906" y="0" width="278" height="100" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="1045" y="35" text-anchor="middle" fill="white" font-size="28" font-family="Arial,sans-serif">🚀</text>
    <text x="1045" y="65" text-anchor="middle" fill="white" font-size="32" font-weight="bold" font-family="Arial,sans-serif">12</text>
    <text x="1045" y="86" text-anchor="middle" fill="#666688" font-size="16" font-family="Arial,sans-serif">Tokens</text>
  </g>

  <!-- Feature Cards -->
  <g transform="translate(64, 320)">
    <!-- Swap -->
    <rect x="0" y="0" width="278" height="180" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="30" y="45" fill="white" font-size="36" font-family="Arial,sans-serif">🔄</text>
    <text x="30" y="85" fill="#8a63d2" font-size="22" font-weight="bold" font-family="Arial,sans-serif">Swap</text>
    <text x="30" y="110" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">0x Protocol DEX routing</text>
    <text x="30" y="132" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">on Arbitrum &amp; Base</text>

    <!-- Token Launch -->
    <rect x="302" y="0" width="278" height="180" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="332" y="45" fill="white" font-size="36" font-family="Arial,sans-serif">🚀</text>
    <text x="332" y="85" fill="#f59e0b" font-size="22" font-weight="bold" font-family="Arial,sans-serif">Token Launch</text>
    <text x="332" y="110" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">One-click ERC-20</text>
    <text x="332" y="132" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">deployment with viem</text>

    <!-- Polls -->
    <rect x="604" y="0" width="278" height="180" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="634" y="45" fill="white" font-size="36" font-family="Arial,sans-serif">📊</text>
    <text x="634" y="85" fill="#10b981" font-size="22" font-weight="bold" font-family="Arial,sans-serif">Polls</text>
    <text x="634" y="110" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">Community voting with</text>
    <text x="634" y="132" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">real-time Supabase counts</text>

    <!-- Notifications -->
    <rect x="906" y="0" width="278" height="180" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="936" y="45" fill="white" font-size="36" font-family="Arial,sans-serif">🔔</text>
    <text x="936" y="85" fill="#ec4899" font-size="22" font-weight="bold" font-family="Arial,sans-serif">Notifications</text>
    <text x="936" y="110" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">Swap confirmations &amp;</text>
    <text x="936" y="132" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">alerts inside Warpcast</text>
  </g>

  <!-- Footer -->
  <text x="64" y="680" fill="#444466" font-size="16" font-family="Arial,sans-serif">github.com/sheclk68/frameo · frameos.sheclk0068.workers.dev</text>
</svg>`;
}

function svgSwap() {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d12"/>
      <stop offset="50%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <filter id="glow1"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="40"/></filter>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.04)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.01)"/>
    </linearGradient>
    <linearGradient id="inputGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.06)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.02)"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <circle cx="1180" cy="-80" r="200" fill="rgba(138,99,210,0.12)" filter="url(#glow1)"/>
  <circle cx="60" cy="600" r="150" fill="rgba(36,186,159,0.07)" filter="url(#glow2)"/>

  <!-- Title -->
  <text x="64" y="80" fill="#8a63d2" font-size="16" font-weight="bold" font-family="Arial,sans-serif" letter-spacing="2">FEATURE</text>
  <text x="64" y="140" fill="white" font-size="52" font-weight="bold" font-family="Arial,sans-serif">🔄 Token Swap</text>
  <text x="64" y="175" fill="#8888aa" font-size="20" font-family="Arial,sans-serif">Real DEX routing via 0x Protocol on Arbitrum &amp; Base — inside Warpcast</text>

  <!-- Swap Form -->
  <g transform="translate(64, 220)">
    <rect x="0" y="0" width="500" height="360" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

    <!-- You Pay -->
    <text x="30" y="40" fill="#8888aa" font-size="17" font-family="Arial,sans-serif">You Pay</text>
    <rect x="350" y="18" width="120" height="32" rx="12" fill="rgba(42,119,214,0.2)"/>
    <text x="410" y="40" text-anchor="middle" fill="#2a77d6" font-size="15" font-weight="bold" font-family="Arial,sans-serif">Arbitrum</text>

    <!-- From input -->
    <rect x="30" y="60" width="440" height="70" rx="14" fill="url(#inputGrad)"/>
    <text x="50" y="103" fill="white" font-size="28" font-weight="bold" font-family="Arial,sans-serif">0.05 ETH</text>
    <text x="420" y="103" fill="#8888aa" font-size="17" font-family="Arial,sans-serif">≈ $120.50</text>

    <!-- Arrow -->
    <text x="250" y="180" text-anchor="middle" fill="#8a63d2" font-size="24" font-family="Arial,sans-serif">↓</text>

    <!-- You Receive -->
    <text x="30" y="210" fill="#8888aa" font-size="17" font-family="Arial,sans-serif">You Receive</text>
    <text x="420" y="210" fill="#24ba9f" font-size="14" font-family="Arial,sans-serif">Best rate · 0.5% slippage</text>

    <!-- To input -->
    <rect x="30" y="230" width="440" height="70" rx="14" fill="url(#inputGrad)"/>
    <text x="50" y="273" fill="white" font-size="28" font-weight="bold" font-family="Arial,sans-serif">3,245 USDC</text>
    <text x="420" y="273" fill="#8888aa" font-size="17" font-family="Arial,sans-serif">Polygon</text>
  </g>

  <!-- Feature List -->
  <g transform="translate(590, 220)">
    <rect x="0" y="0" width="580" height="60" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="60" y="38" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">⚡ 0x Protocol aggregation for best execution</text>

    <rect x="0" y="75" width="580" height="60" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="60" y="113" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">🔗 Multi-chain: Arbitrum + Base unified</text>

    <rect x="0" y="150" width="580" height="60" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="60" y="188" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">💳 Farcaster embedded wallet — no extra sign-in</text>

    <rect x="0" y="225" width="580" height="60" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="60" y="263" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">📉 Slippage protection &amp; gas estimation</text>

    <rect x="0" y="300" width="580" height="60" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="60" y="338" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">📋 Swap history stored in Supabase</text>
  </g>

  <text x="64" y="680" fill="#444466" font-size="16" font-family="Arial,sans-serif">github.com/sheclk68/frameo · frameos.sheclk0068.workers.dev</text>
</svg>`;
}

function svgLaunch() {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d12"/>
      <stop offset="50%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <filter id="glow1"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="40"/></filter>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.04)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.01)"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <circle cx="1150" cy="-60" r="180" fill="rgba(245,158,11,0.12)" filter="url(#glow1)"/>
  <circle cx="50" cy="600" r="130" fill="rgba(217,70,35,0.07)" filter="url(#glow2)"/>

  <!-- Title -->
  <text x="64" y="80" fill="#f59e0b" font-size="16" font-weight="bold" font-family="Arial,sans-serif" letter-spacing="2">FEATURE</text>
  <text x="64" y="140" fill="white" font-size="52" font-weight="bold" font-family="Arial,sans-serif">🚀 Token Launch</text>
  <text x="64" y="175" fill="#8888aa" font-size="20" font-family="Arial,sans-serif">Deploy ERC-20 tokens on Arbitrum &amp; Base with one click — viem + Solidity</text>

  <!-- Steps -->
  <g transform="translate(64, 280)">
    <rect x="0" y="0" width="230" height="150" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="115" y="45" text-anchor="middle" fill="white" font-size="36" font-family="Arial,sans-serif">📝</text>
    <text x="115" y="85" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Fill Form</text>
    <text x="115" y="110" text-anchor="middle" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">Name, symbol, supply</text>
    <text x="280" y="85" fill="#f59e0b" font-size="28" font-family="Arial,sans-serif">→</text>

    <rect x="330" y="0" width="230" height="150" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="445" y="45" text-anchor="middle" fill="white" font-size="36" font-family="Arial,sans-serif">⚙️</text>
    <text x="445" y="85" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Compile</text>
    <text x="445" y="110" text-anchor="middle" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">Solidity → bytecode</text>
    <text x="610" y="85" fill="#f59e0b" font-size="28" font-family="Arial,sans-serif">→</text>

    <rect x="660" y="0" width="230" height="150" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="775" y="45" text-anchor="middle" fill="white" font-size="36" font-family="Arial,sans-serif">⛓️</text>
    <text x="775" y="85" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Deploy</text>
    <text x="775" y="110" text-anchor="middle" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">viem → chain</text>
    <text x="940" y="85" fill="#f59e0b" font-size="28" font-family="Arial,sans-serif">→</text>

    <rect x="990" y="0" width="230" height="150" rx="16" fill="rgba(36,186,159,0.08)" stroke="rgba(36,186,159,0.2)" stroke-width="1"/>
    <text x="1105" y="45" text-anchor="middle" fill="white" font-size="36" font-family="Arial,sans-serif">🎉</text>
    <text x="1105" y="85" text-anchor="middle" fill="#24ba9f" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Live!</text>
    <text x="1105" y="110" text-anchor="middle" fill="#8888aa" font-size="15" font-family="Arial,sans-serif">Token on-chain</text>
  </g>

  <!-- Tech tags -->
  <g transform="translate(64, 480)">
    <rect x="0" y="0" width="268" height="80" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="134" y="30" text-anchor="middle" fill="#8a63d2" font-size="14" font-weight="bold" font-family="Arial,sans-serif">Contract</text>
    <text x="134" y="55" text-anchor="middle" fill="#aaaacc" font-size="16" font-family="Arial,sans-serif">ERC-20 · 18 decimals</text>

    <rect x="284" y="0" width="268" height="80" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="418" y="30" text-anchor="middle" fill="#4a90d9" font-size="14" font-weight="bold" font-family="Arial,sans-serif">Compiler</text>
    <text x="418" y="55" text-anchor="middle" fill="#aaaacc" font-size="16" font-family="Arial,sans-serif">solc 0.8.19 · viem</text>

    <rect x="568" y="0" width="268" height="80" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="702" y="30" text-anchor="middle" fill="#24ba9f" font-size="14" font-weight="bold" font-family="Arial,sans-serif">Chains</text>
    <text x="702" y="55" text-anchor="middle" fill="#aaaacc" font-size="16" font-family="Arial,sans-serif">Arbitrum + Base</text>

    <rect x="852" y="0" width="268" height="80" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="986" y="30" text-anchor="middle" fill="#f59e0b" font-size="14" font-weight="bold" font-family="Arial,sans-serif">Wallet</text>
    <text x="986" y="55" text-anchor="middle" fill="#aaaacc" font-size="16" font-family="Arial,sans-serif">Farcaster embedded</text>
  </g>

  <text x="64" y="680" fill="#444466" font-size="16" font-family="Arial,sans-serif">github.com/sheclk68/frameo · frameos.sheclk0068.workers.dev</text>
</svg>`;
}

function svgTech() {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d0d12"/>
      <stop offset="50%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <filter id="glow1"><feGaussianBlur stdDeviation="60"/></filter>
    <filter id="glow2"><feGaussianBlur stdDeviation="40"/></filter>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.04)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.01)"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <circle cx="300" cy="-40" r="160" fill="rgba(74,144,217,0.1)" filter="url(#glow1)"/>
  <circle cx="1000" cy="620" r="140" fill="rgba(138,99,210,0.06)" filter="url(#glow2)"/>

  <!-- Title -->
  <text x="64" y="80" fill="#4a90d9" font-size="16" font-weight="bold" font-family="Arial,sans-serif" letter-spacing="2">ARCHITECTURE</text>
  <text x="64" y="140" fill="white" font-size="52" font-weight="bold" font-family="Arial,sans-serif">🏗️ Tech Stack</text>

  <!-- Flow -->
  <g transform="translate(64, 220)">
    <rect x="0" y="0" width="180" height="60" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="90" y="38" text-anchor="middle" fill="#8a63d2" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Warpcast</text>
    <text x="210" y="38" fill="#444466" font-size="20" font-family="Arial,sans-serif">→</text>

    <rect x="250" y="0" width="180" height="60" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="340" y="38" text-anchor="middle" fill="#f59e0b" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Cloudflare</text>
    <text x="460" y="38" fill="#444466" font-size="20" font-family="Arial,sans-serif">→</text>

    <rect x="500" y="0" width="180" height="60" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="590" y="38" text-anchor="middle" fill="#4a90d9" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Vercel</text>
    <text x="710" y="38" fill="#444466" font-size="20" font-family="Arial,sans-serif">→</text>

    <rect x="750" y="0" width="180" height="60" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="840" y="38" text-anchor="middle" fill="#24ba9f" font-size="20" font-weight="bold" font-family="Arial,sans-serif">0x + viem</text>
    <text x="960" y="38" fill="#444466" font-size="20" font-family="Arial,sans-serif">→</text>

    <rect x="1000" y="0" width="180" height="60" rx="16" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <text x="1090" y="38" text-anchor="middle" fill="#10b981" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Supabase</text>
  </g>

  <!-- Tech Columns -->
  <g transform="translate(64, 340)">
    <rect x="0" y="0" width="278" height="240" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="24" y="35" fill="#8a63d2" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Frontend</text>
    <text x="24" y="70" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Next.js 16</text>
    <text x="24" y="100" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">TypeScript</text>
    <text x="24" y="130" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Tailwind CSS</text>
    <text x="24" y="160" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Glass UI</text>

    <rect x="302" y="0" width="278" height="240" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="326" y="35" fill="#f59e0b" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Blockchain</text>
    <text x="326" y="70" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">viem</text>
    <text x="326" y="100" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">0x Protocol</text>
    <text x="326" y="130" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Solidity</text>
    <text x="326" y="160" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Arbitrum + Base</text>

    <rect x="604" y="0" width="278" height="240" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="628" y="35" fill="#24ba9f" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Backend</text>
    <text x="628" y="70" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Supabase</text>
    <text x="628" y="100" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">RLS Policies</text>
    <text x="628" y="130" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Cloudflare Workers</text>
    <text x="628" y="160" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Vercel Edge</text>

    <rect x="906" y="0" width="278" height="240" rx="14" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    <text x="930" y="35" fill="#4a90d9" font-size="20" font-weight="bold" font-family="Arial,sans-serif">Farcaster</text>
    <text x="930" y="70" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">miniapp-sdk</text>
    <text x="930" y="100" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Embedded Wallet</text>
    <text x="930" y="130" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Warpcast iframe</text>
    <text x="930" y="160" fill="#aaaacc" font-size="17" font-family="Arial,sans-serif">Domain manifest</text>
  </g>

  <text x="64" y="680" fill="#444466" font-size="16" font-family="Arial,sans-serif">github.com/sheclk68/frameo · Open Source (MIT)</text>
</svg>`;
}

const images = [
  { name: "frameos-home.png", svg: svgHome() },
  { name: "frameos-swap.png", svg: svgSwap() },
  { name: "frameos-launch.png", svg: svgLaunch() },
  { name: "frameos-tech.png", svg: svgTech() },
];

console.log("Generating project images...\n");

for (const { name, svg } of images) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const filepath = join(DESKTOP, name);
  writeFileSync(filepath, pngBuffer);
  console.log(`✓ ${name} (${(pngBuffer.length / 1024).toFixed(0)} KB)`);
}

console.log("\nDone! 4 images saved to Desktop.");
