import { NextResponse } from "next/server";
import { readRoast } from "../../lib/store";
import { ttsCached } from "../../lib/voice";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Chappie's homepage barks. Poke him → a short spoken comment about a site he
// just reviewed (?id=<roastId>), or the follow-us line (?kind=follow). Each
// bark is TTS'd once and cached in blob.

const FOLLOW_LINE =
  "Follow Chappie on X for more site roasts... and don't steal Daddy's car! Show respect!";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");

  if (kind === "follow") {
    const r = await ttsCached("voices/v3/bark-follow.mp3", FOLLOW_LINE);
    if ("error" in r) return NextResponse.json(r, { status: 503 });
    return NextResponse.json({ url: r.url, text: FOLLOW_LINE });
  }

  const id = searchParams.get("id") ?? "";
  const rec = await readRoast(id);
  if (!rec) {
    return NextResponse.json({ error: "roast not found" }, { status: 404 });
  }
  const host = new URL(rec.facts.finalUrl).hostname.replace(/^www\./, "");
  const text = `Chappie just looked at ${host}. ${rec.roast.score} out of one hundred. ${rec.roast.verdict}`;
  const r = await ttsCached(`voices/v3/bark-${id}.mp3`, text);
  if ("error" in r) return NextResponse.json(r, { status: 503 });
  return NextResponse.json({ url: r.url, text });
}
