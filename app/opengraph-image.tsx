import { ImageResponse } from "next/og";

// The default link-preview card (iMessage, X, Slack, Discord all read this).
// Roast pages override it with their per-roast score card.

export const alt =
  "Sites That Suck — two websites a day, roasted by Chappie the robot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b0b0c 0%, #1a1508 100%)",
          color: "#faf7ee",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 8,
            color: "#c9a437",
            textTransform: "uppercase",
          }}
        >
          chappiebarks.com
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 110, fontWeight: 800, lineHeight: 1.02 }}>
            SITES THAT
          </div>
          <div
            style={{
              fontSize: 110,
              fontWeight: 800,
              lineHeight: 1.02,
              color: "#c9a437",
            }}
          >
            SUCK.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 28,
            color: "#faf7eeaa",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div>Two victims a day. Judged by an actual robot.</div>
            <div style={{ color: "#c9a437", marginTop: 8 }}>
              He laughs because it&rsquo;s funny.
            </div>
          </div>
          <div style={{ fontSize: 72 }}>🤖</div>
        </div>
      </div>
    ),
    size,
  );
}
