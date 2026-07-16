import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nominations: "roast this site next" (their own, a competitor's, their
// boss's). Every nomination is a lead — an email attached to a domain someone
// cares about. The studio picks the day's two victims from this queue.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    url?: string;
    email?: string;
  };
  const url = (body.url ?? "").trim().slice(0, 300);
  const email = (body.email ?? "").trim().toLowerCase();
  if (!url || !/\./.test(url)) {
    return NextResponse.json({ error: "give Chappie a real URL" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "an email, so Chappie can tell you when it's roasted" },
      { status: 400 },
    );
  }
  const id = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  await put(
    `nominations/${id}.json`,
    JSON.stringify({ url, email, at: new Date().toISOString() }),
    { access: "public", contentType: "application/json", addRandomSuffix: false },
  );
  console.log("[sitesthatsuck] nomination", url, email);
  return NextResponse.json({ ok: true });
}
