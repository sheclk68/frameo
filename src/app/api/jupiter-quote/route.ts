import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Proxy for Jupiter v6 quote API — avoids CORS issues from browser
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
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Jupiter API error (${res.status})`, detail: text.slice(0, 300) },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Jupiter proxy error: ${msg}` },
      { status: 502 }
    );
  }
}
