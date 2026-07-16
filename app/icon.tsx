import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// Favicon: gold tile, robot. Shows next to the URL in browsers + previews.
export default function Icon() {
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
          borderRadius: 12,
          fontSize: 44,
        }}
      >
        🤖
      </div>
    ),
    size,
  );
}
