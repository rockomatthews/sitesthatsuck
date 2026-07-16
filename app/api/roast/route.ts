import { NextResponse } from "next/server";
import { inspectSite } from "../../lib/inspect";
import { generateRoast } from "../../lib/roast";
import { newId, writeRoast } from "../../lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// EDITORIAL ONLY (Sire's call): the public never roasts directly — the studio
// picks 2 victims a day and publishes via this endpoint with the admin secret.
export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers.get("x-admin-secret") !== secret) {
    return NextResponse.json(
      { error: "Chappie picks the victims. Nominate one on the homepage." },
      { status: 403 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { url?: string };
  const url = (body.url ?? "").trim();
  if (!url || url.length > 300) {
    return NextResponse.json({ error: "give Chappie a URL" }, { status: 400 });
  }

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
