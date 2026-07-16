import { NextResponse } from "next/server";
import { readRoast, writeRoast, writeLead } from "../../lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The quiet part: unlocking the fix list costs an email. Every unlock files a
// lead — domain + email + diagnosed problems — the studio's client pipeline.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    email?: string;
  };
  const id = (body.id ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "a real email unlocks it" }, { status: 400 });
  }
  const rec = await readRoast(id);
  if (!rec) {
    return NextResponse.json({ error: "roast not found" }, { status: 404 });
  }

  if (!rec.unlockedBy?.includes(email)) {
    rec.unlockedBy = [...(rec.unlockedBy ?? []), email];
    await writeRoast(rec);
    await writeLead({
      email,
      roastId: id,
      site: rec.facts.finalUrl,
      score: rec.roast.score,
    });
    console.log("[sitesthatsuck] lead", email, "→", rec.facts.finalUrl);
  }

  return NextResponse.json({ fixes: rec.roast.fixes });
}
