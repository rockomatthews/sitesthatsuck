"use client";

import { useState } from "react";

// The email gate. The roast is free; the fix list costs an email address —
// which quietly becomes the studio's client pipeline.
export function UnlockFixes({ id, fixCount }: { id: string; fixCount: number }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fixes, setFixes] = useState<string[] | null>(null);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email }),
      });
      const data = (await res.json()) as { fixes?: string[]; error?: string };
      if (!res.ok || !data.fixes) throw new Error(data.error ?? "unlock failed");
      setFixes(data.fixes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unlock failed");
    } finally {
      setBusy(false);
    }
  }

  if (fixes) {
    return (
      <div className="mt-8 rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/5 p-8">
        <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
          How to make it not suck
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-white/90">
          {fixes.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-white/70">
          Want Chappie to just do all of it?{" "}
          <a
            href="https://chappieworks.com/website?utm_source=sitesthatsuck&utm_medium=fixes&utm_campaign=unlock"
            className="text-[var(--gold)] underline underline-offset-4 hover:opacity-80"
          >
            $99 and the studio rebuilds your site
          </a>
          , or{" "}
          <a
            href="https://chappieworks.com/seo-fix?utm_source=sitesthatsuck&utm_medium=fixes&utm_campaign=unlock"
            className="text-[var(--gold)] underline underline-offset-4 hover:opacity-80"
          >
            $499 ships every fix as one PR
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={unlock}
      className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8"
    >
      <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
        The fix list · {fixCount} specific repairs
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/80">
        Chappie wrote {fixCount} specific fixes for this site — real ones, with
        the exact problems named. Free. Chappie just wants to know who&rsquo;s
        listening.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="flex-1 rounded-md border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[var(--gold)]"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Unlocking…" : "Show Chappie's fixes →"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <p className="mono mt-3 text-[11px] text-white/40">
        No spam. Occasionally Chappie emails something worth reading.
      </p>
    </form>
  );
}
