import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { readRoast } from "../../../lib/store";
import { scoreLabel } from "../../../lib/roast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The share card — built to be screenshotted. Big score, savage verdict,
// Chappie branding. This image IS the growth loop.

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const rec = await readRoast(id);
  if (!rec) return new Response("not found", { status: 404 });
  const host = new URL(rec.facts.finalUrl).hostname;
  const head = await readFile(
    path.join(process.cwd(), "public", "chappie-head.png"),
  );
  const headSrc = `data:image/png;base64,${head.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0c",
          color: "#faf7ee",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 24,
                letterSpacing: 6,
                color: "#c9a437",
                textTransform: "uppercase",
              }}
            >
              {"sites that suck · Chappie's verdict"}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={headSrc}
              width={130}
              height={130}
              style={{ borderRadius: 16 }}
              alt=""
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 8 }}>
            <div
              style={{
                fontSize: 180,
                fontWeight: 800,
                color: "#c9a437",
                lineHeight: 1,
              }}
            >
              {String(rec.roast.score)}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 24,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 28, color: "#faf7ee99" }}>/100 suck score</div>
              <div style={{ fontSize: 40, fontWeight: 700 }}>
                {scoreLabel(rec.roast.score)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* single string child — satori rejects mixed text+expression nodes
              without explicit display:flex */}
          <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.25 }}>
            {`“${rec.roast.verdict}”`}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 40,
              fontSize: 26,
              color: "#faf7ee88",
            }}
          >
            <div>{host}</div>
            <div style={{ color: "#c9a437" }}>nominate a victim → chappiebarks.com</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
