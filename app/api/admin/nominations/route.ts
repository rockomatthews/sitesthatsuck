import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only: the nomination queue (and lead list), newest first.
export async function GET(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers.get("x-admin-secret") !== secret) {
    return NextResponse.json({ error: "no" }, { status: 403 });
  }

  const [noms, leads] = await Promise.all([
    list({ prefix: "nominations/" }),
    list({ prefix: "leads/" }),
  ]);

  async function load(blobs: { url: string; uploadedAt: string | Date; pathname: string }[], limit: number) {
    const newest = [...blobs]
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      )
      .slice(0, limit);
    const out = await Promise.all(
      newest.map(async (b) => {
        try {
          const res = await fetch(`${b.url}?v=${Date.now()}`, { cache: "no-store" });
          return res.ok ? await res.json() : null;
        } catch {
          return null;
        }
      }),
    );
    return out.filter(Boolean);
  }

  return NextResponse.json({
    nominations: await load(noms.blobs, 100),
    leads: await load(leads.blobs, 100),
  });
}
