import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d0d12, #1a0a2e)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(138, 99, 210, 0.3), transparent 70%)",
          }}
        />
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8a63d2, #4a90d9, #38b2ac)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            boxShadow: "0 0 60px rgba(138, 99, 210, 0.5)",
          }}
        >
          F
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#b794f4",
            marginTop: 20,
            letterSpacing: "0.05em",
          }}
        >
          FrameOS
        </div>
      </div>
    ),
    {
      width: 400,
      height: 400,
    }
  );
}
