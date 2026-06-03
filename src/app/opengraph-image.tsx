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
          background: "linear-gradient(135deg, #07070d 0%, #150a2e 30%, #0a0a20 60%, #07070d 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Large background glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124, 58, 237, 0.3), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(20, 184, 166, 0.15), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%)",
          }}
        />

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage:
              "linear-gradient(rgba(124, 58, 237, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {/* Big Logo */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #3b82f6, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 800,
              color: "white",
              marginBottom: 24,
              boxShadow: "0 0 60px rgba(124, 58, 237, 0.5)",
            }}
          >
            F
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 76,
              fontWeight: 800,
              background: "linear-gradient(135deg, #c4b5fd, #60a5fa, #5eead4)",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            FrameOS
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 24,
              color: "#8899bb",
              letterSpacing: "0.1em",
              marginBottom: 40,
            }}
          >
            Farcaster Mini App Hub
          </div>

          {/* Feature badges row */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: 28,
            }}
          >
            {[
              { label: "Multi-Chain Swap", color: "#7c3aed" },
              { label: "Token Launch", color: "#3b82f6" },
              { label: "Polls & Voting", color: "#14b8a6" },
              { label: "7 Chains", color: "#f59e0b" },
            ].map((f) => (
              <div
                key={f.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${f.color}33`,
                  borderRadius: 100,
                  padding: "10px 22px",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: f.color,
                  }}
                />
                <span style={{ fontSize: 16, fontWeight: 600, color: "#d0d0f0" }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* URL */}
          <div
            style={{
              fontSize: 18,
              color: "#444466",
              letterSpacing: "0.05em",
              padding: "10px 28px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 40,
              border: "1px solid rgba(124, 58, 237, 0.1)",
            }}
          >
            frameos.sheclk0068.workers.dev
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
