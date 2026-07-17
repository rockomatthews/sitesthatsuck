import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

// The default link-preview card (iMessage, X, Slack, Discord). Real Chappie,
// rendered from the actual 3D model — no emoji stand-ins.

export const alt =
  "Sites That Suck — two websites a day, roasted by Chappie the robot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const chappie = await readFile(
    path.join(process.cwd(), "public", "chappie.png"),
  );
  const chappieSrc = `data:image/png;base64,${chappie.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0b0b0c 0%, #1a1508 100%)",
          color: "#faf7ee",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 64,
            width: 720,
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: 7,
              color: "#c9a437",
              textTransform: "uppercase",
            }}
          >
            chappiebarks.com
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.02 }}>
              SITES THAT
            </div>
            <div
              style={{
                fontSize: 96,
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
              flexDirection: "column",
              fontSize: 26,
              color: "#faf7eeaa",
            }}
          >
            <div>Two victims a day. Judged by an actual robot.</div>
            <div style={{ color: "#c9a437", marginTop: 8 }}>
              {"He laughs because it's funny."}
            </div>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={chappieSrc}
          width={480}
          height={630}
          style={{ objectFit: "cover", objectPosition: "center top" }}
          alt=""
        />
      </div>
    ),
    size,
  );
}
