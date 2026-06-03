import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for Jupiter v6 quote API.
 * Bypasses client-side SOCKS/VPN restrictions by fetching from Vercel's servers.
 * GET /api/jupiter-quote?inputMint=...&outputMint=...&amount=...&slippageBps=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = searchParams.get("slippageBps") ?? "50";
  const swapMode = searchParams.get("swapMode") ?? "ExactIn";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "Missing required params: inputMint, outputMint, amount" },
      { status: 400 }
    );
  }

  try {
    const url = new URL("https://quote-api.jup.ag/v6/quote");
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", amount);
    url.searchParams.set("slippageBps", slippageBps);
    url.searchParams.set("swapMode", swapMode);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Jupiter API error (${res.status})`, detail: text.slice(0, 300) },
        { status: res.status }
      );
    }

    const data = await res.json();
    // Set CORS headers so the browser accepts the response
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Jupiter proxy error: ${msg}` },
      { status: 502 }
    );
  }
}
