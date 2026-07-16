"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const WAIT_LINES = [
  "Chappie is looking at your site…",
  "Chappie has questions…",
  "Chappie is showing Glass. Glass is not happy…",
  "Forge is timing your load speed. Out loud…",
  "Skeptic is reading your headline. Twice…",
  "Chappie is choosing kind words. Discarding them…",
];

export function RoastForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [line, setLine] = useState(WAIT_LINES[0]);
  const [error, setError] = useState<string | null>(null);

  async function roast(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    let i = 0;
    const ticker = setInterval(() => {
      i = (i + 1) % WAIT_LINES.length;
      setLine(WAIT_LINES[i]);
    }, 2500);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "roast failed");
      router.push(`/r/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "roast failed");
      setBusy(false);
    } finally {
      clearInterval(ticker);
    }
  }

  return (
    <form onSubmit={roast} className="pointer-events-auto mt-8 w-full max-w-xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourwebsite.com — or a competitor's"
          className="flex-1 rounded-md border border-white/20 bg-black/50 px-5 py-4 text-base outline-none backdrop-blur placeholder:text-white/35 focus:border-[var(--gold)]"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !url.trim()}
          className="rounded-md bg-[var(--gold)] px-8 py-4 text-base font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Roasting…" : "Roast it →"}
        </button>
      </div>
      {busy && (
        <p className="mono mt-3 animate-pulse text-sm text-[var(--gold)]">{line}</p>
      )}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <p className="mono mt-3 text-xs text-white/40">
        Free. 30 seconds. Chappie keeps the receipts.
      </p>
    </form>
  );
}
