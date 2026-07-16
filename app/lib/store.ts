import { put, list } from "@vercel/blob";
import type { Roast } from "./roast";
import type { SiteFacts } from "./inspect";

// Roast records + the (quietly growing) lead list, on Vercel Blob — same
// storage model as chappieworks (public store, cache-busted reads).

export type RoastRecord = {
  id: string;
  createdAt: string;
  facts: SiteFacts;
  roast: Roast;
  // set once someone unlocks the full fix list with an email
  unlockedBy?: string[];
};

const ROAST_KEY = (id: string) => `roasts/${id}.json`;
const LEAD_KEY = (id: string) => `leads/${id}.json`;

export function newId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function writeRoast(rec: RoastRecord): Promise<void> {
  await put(ROAST_KEY(rec.id), JSON.stringify(rec, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function readRoast(id: string): Promise<RoastRecord | null> {
  if (!/^[0-9a-f]{16}$/.test(id)) return null;
  const key = ROAST_KEY(id);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { blobs } = await list({ prefix: key });
    const blob = blobs.find((b) => b.pathname === key);
    if (blob) {
      const res = await fetch(`${blob.url}?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as RoastRecord;
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

// Editorial index: newest roasts for the homepage (we publish 2/day). Fetches
// the N most recent records; the page revalidates so this stays cheap.
export async function listRoasts(limit = 14): Promise<RoastRecord[]> {
  const { blobs } = await list({ prefix: "roasts/" });
  const newest = blobs
    .filter((b) => b.pathname.endsWith(".json"))
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )
    .slice(0, limit);
  const recs = await Promise.all(
    newest.map(async (b) => {
      try {
        const res = await fetch(`${b.url}?v=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return null;
        return (await res.json()) as RoastRecord;
      } catch {
        return null;
      }
    }),
  );
  return recs.filter((r): r is RoastRecord => r !== null);
}

// The client list. One JSON per lead: email + which site they roasted + what
// the roast diagnosed — a pre-qualified pipeline for the studio's SKUs.
export async function writeLead(lead: {
  email: string;
  roastId: string;
  site: string;
  score: number;
}): Promise<void> {
  const id = `${Date.now()}-${newId()}`;
  await put(LEAD_KEY(id), JSON.stringify({ ...lead, at: new Date().toISOString() }), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}
