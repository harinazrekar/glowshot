"use client";

import type { FrameStyle, FrameTheme } from "@/lib/types";

interface WindowFrameProps {
  frame: FrameStyle;
  theme: FrameTheme;
  title?: string;
  radius: number;
  /** Hide the traffic-light / caption controls, keeping just the title bar. */
  hideControls?: boolean;
  /** background of the window body (behind code/image) */
  bodyBg?: string;
  children: React.ReactNode;
}

const TRAFFIC = ["#ff5f57", "#febc2e", "#28c840"];

export function WindowFrame({
  frame,
  theme,
  title,
  radius,
  hideControls,
  bodyBg,
  children,
}: WindowFrameProps) {
  const dark = theme === "dark";
  const chromeBg = dark ? "#1e1e26" : "#f0f0f3";
  const chromeBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const chromeText = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.5)";
  const defaultBody = dark ? "#0d0d12" : "#ffffff";

  const windows = frame === "windows";

  return (
    <div
      style={{
        borderRadius: radius,
        overflow: "hidden",
        border: `1px solid ${chromeBorder}`,
        background: bodyBg ?? defaultBody,
      }}
    >
      {frame !== "none" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: frame === "browser" ? "10px 14px" : "12px 16px",
            background: chromeBg,
            borderBottom: `1px solid ${chromeBorder}`,
          }}
        >
          {/* macOS / browser traffic lights (left) */}
          {!windows && !hideControls && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {TRAFFIC.map((c) => (
                <span
                  key={c}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: c,
                    display: "inline-block",
                  }}
                />
              ))}
            </div>
          )}

          {frame === "browser" ? (
            <div
              style={{
                flex: 1,
                margin: "0 8px",
                padding: "5px 12px",
                borderRadius: 999,
                background: dark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.05)",
                color: chromeText,
                fontSize: 12,
                fontFamily: "var(--font-sans), sans-serif",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title || "example.com"}
            </div>
          ) : (
            title && (
              <div
                style={{
                  flex: 1,
                  textAlign: windows ? "left" : "center",
                  color: chromeText,
                  fontSize: 13,
                  fontFamily: "var(--font-mono), monospace",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  // Balance the (invisible) opposite control cluster so the
                  // title stays visually centered on macOS.
                  marginRight: windows || hideControls ? 0 : 44,
                }}
              >
                {title}
              </div>
            )
          )}

          {/* Windows caption buttons (right) */}
          {windows && !hideControls && (
            <div style={{ display: "flex", gap: 18, flexShrink: 0, color: chromeText }}>
              <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
                <line x1="0" y1="5.5" x2="11" y2="5.5" stroke="currentColor" strokeWidth="1" />
              </svg>
              <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
                <rect x="0.5" y="0.5" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
              <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
                <line x1="0" y1="0" x2="11" y2="11" stroke="currentColor" strokeWidth="1" />
                <line x1="11" y1="0" x2="0" y2="11" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
          )}
        </div>
      )}

      <div>{children}</div>
    </div>
  );
}
