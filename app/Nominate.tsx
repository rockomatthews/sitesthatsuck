"use client";

import { useState } from "react";

export function Nominate() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm leading-relaxed text-[var(--gold)]">
        Noted. If Chappie picks it, you&rsquo;ll get the roast in your inbox —
        Chappie hopes it&rsquo;s not your site. (Chappie suspects it&rsquo;s
        your site.)
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="the site (yours, a competitor's, your boss's)"
          className="flex-1 rounded-md border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[var(--gold)]"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your email"
          className="flex-1 rounded-md border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-[var(--gold)]"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Filing…" : "Nominate →"}
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
