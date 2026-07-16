import { ImageResponse } from "next/og";
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
              fontSize: 24,
              letterSpacing: 6,
              color: "#c9a437",
              textTransform: "uppercase",
            }}
          >
            sites that suck · Chappie&rsquo;s verdict
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 40 }}>
            <div
              style={{
                fontSize: 180,
                fontWeight: 800,
                color: "#c9a437",
                lineHeight: 1,
              }}
            >
              {rec.roast.score}
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
          <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.25 }}>
            &ldquo;{rec.roast.verdict}&rdquo;
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
