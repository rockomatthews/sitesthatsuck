import { NextResponse } from "next/server";
import { inspectSite } from "../../lib/inspect";
import { generateRoast } from "../../lib/roast";
import { newId, writeRoast } from "../../lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Cheap in-memory throttle per instance (serverless = best-effort, fine for v1).
const recent = new Map<string, number>();

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = (body.url ?? "").trim();
  if (!url || url.length > 300) {
    return NextResponse.json({ error: "give Chappie a URL" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const last = recent.get(ip) ?? 0;
  if (Date.now() - last < 10_000) {
    return NextResponse.json(
      { error: "Chappie roasts one site at a time. Wait a moment." },
      { status: 429 },
    );
  }
  recent.set(ip, Date.now());

  try {
    const facts = await inspectSite(url);
    const roast = await generateRoast(facts);
    const id = newId();
    await writeRoast({
      id,
      createdAt: new Date().toISOString(),
      facts,
      roast,
    });
    console.log("[sitesthatsuck] roasted", facts.finalUrl, "score", roast.score, id);
    return NextResponse.json({ id });
  } catch (err) {
    const m = err instanceof Error ? err.message : "unknown";
    console.error("[sitesthatsuck] roast failed", url, m);
    const friendly = /not a public website|Invalid URL/i.test(m)
      ? "Chappie can only roast public websites."
      : /timeout|abort/i.test(m)
        ? "That site took so long to load Chappie fell asleep. (That's part of the problem.)"
        : "Chappie couldn't reach that site. Check the URL.";
    return NextResponse.json({ error: friendly }, { status: 502 });
  }
}
