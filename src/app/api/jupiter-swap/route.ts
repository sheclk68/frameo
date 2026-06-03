import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Proxy for Jupiter v6 swap transaction API — avoids CORS issues from browser
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
        { error: `Jupiter swap API error (${res.status})`, detail: text.slice(0, 300) },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Jupiter swap proxy error: ${msg}` },
      { status: 502 }
    );
  }
}
