import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FrameOS - Farcaster Mini App Hub",
  description: "Swap tokens, vote on polls, create tokens across 8 chains",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/icon.svg", type: "image/svg+xml" },
  },
  other: {
    "fc:frame": '{"version":"next","imageUrl":"https://my-frame-app.vercel.app/opengraph-image","button":{"title":"Launch App","action":{"type":"launch_frame","name":"FrameOS","url":"https://my-frame-app.vercel.app"}}}',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white">{children}</body>
    </html>
  );
}
