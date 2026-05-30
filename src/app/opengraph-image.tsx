import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "FrameOS - Farcaster Mini App Hub";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d0d12 0%, #1a1a2e 50%, #16213e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(138, 99, 210, 0.15)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -120,
            left: -80,
            width: 350,
            height: 350,
            borderRadius: "50%",
            background: "rgba(74, 144, 217, 0.12)",
            filter: "blur(50px)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8a63d2, #4a90d9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            fontWeight: 700,
            color: "white",
            marginBottom: 32,
            boxShadow: "0 0 40px rgba(138, 99, 210, 0.3)",
          }}
        >
          F
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            background: "linear-gradient(135deg, #8a63d2, #4a90d9, #38b2ac)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 12,
            letterSpacing: "-0.02em",
          }}
        >
          FrameOS
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#8888aa",
            marginBottom: 40,
            letterSpacing: "0.05em",
          }}
        >
          Farcaster Mini App Hub
        </div>

        {/* Features row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            color: "#666688",
            fontSize: 20,
          }}
        >
          <span>🔄 Swap</span>
          <span>📊 Polls</span>
          <span>🚀 Launch</span>
          <span>🔔 Alerts</span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 18,
            color: "#444466",
          }}
        >
          Built on Farcaster · Base Chain
        </div>
      </div>
    ),
    { ...size }
  );
}
