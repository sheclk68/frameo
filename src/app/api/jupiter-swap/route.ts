import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for Jupiter v6 swap transaction API.
 * Bypasses client-side SOCKS/VPN restrictions by fetching from Vercel's servers.
 * POST /api/jupiter-swap
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Jupiter swap error (${res.status})`, detail: text.slice(0, 300) },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Jupiter swap proxy error: ${msg}` },
      { status: 502 }
    );
  }
}
