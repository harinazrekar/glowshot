import { ImageResponse } from "next/og";

export const alt =
  "Glowshot — turn screenshots & code into gorgeous images";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rendered at build time into a static social-share card.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0a0f",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Ambient brand glow */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 640,
            height: 640,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(169,96,238,0.55) 0%, rgba(124,92,255,0.0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -160,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(124,92,255,0.45) 0%, rgba(124,92,255,0.0) 70%)",
            display: "flex",
          }}
        />

        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg,#a960ee,#7c5cff)",
              boxShadow: "0 0 40px rgba(124,92,255,0.7)",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            Glowshot
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: 44,
            fontSize: 74,
            fontWeight: 800,
            lineHeight: 1.05,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            maxWidth: 900,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Turn screenshots & code</span>
          <span
            style={{
              background: "linear-gradient(135deg,#c98bff,#8a9bff)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            into gorgeous images.
          </span>
        </div>

        {/* Sub */}
        <div
          style={{
            marginTop: 34,
            fontSize: 30,
            color: "rgba(255,255,255,0.62)",
            fontWeight: 500,
            display: "flex",
          }}
        >
          Free & open source · No signup · 100% in your browser
        </div>
      </div>
    ),
    { ...size }
  );
}
