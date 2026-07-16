import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// apple-touch-icon: what iMessage/iOS fall back to when a page has no OG
// image, and the home-screen icon. Same gold robot, iOS-safe full square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#c9a437",
          fontSize: 120,
        }}
      >
        🤖
      </div>
    ),
    size,
  );
}
