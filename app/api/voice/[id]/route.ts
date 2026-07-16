import { NextResponse } from "next/server";
import { readRoast } from "../../../lib/store";
import { getOrCreateVoice, voiceScript } from "../../../lib/voice";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Lazy TTS: first listener pays the ~1s generation, everyone after gets the
// cached mp3 straight from blob.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const rec = await readRoast(id);
  if (!rec) {
    return NextResponse.json({ error: "roast not found" }, { status: 404 });
  }
  const result = await getOrCreateVoice(
    id,
    voiceScript(rec.roast.verdict, rec.roast.chappie),
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }
  return NextResponse.json({ url: result.url });
}
