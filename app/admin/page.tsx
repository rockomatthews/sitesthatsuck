"use client";

/* The control room. Paste the admin secret once (kept in localStorage), see
   the nomination queue + captured leads, roast any URL with one click. This
   page holds no secrets itself — every request is authorized by the header,
   so shipping the page publicly is safe. */

import { useEffect, useState } from "react";

type Nomination = { url: string; email: string; at: string };
type Lead = { email: string; site: string; score: number; at: string };

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [noms, setNoms] = useState<Nomination[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const s = localStorage.getItem("admin-secret");
    if (s) {
      setSecret(s);
      void load(s);
    }
  }, []);

  async function load(s: string) {
    const res = await fetch("/api/admin/nominations", {
      headers: { "x-admin-secret": s },
      cache: "no-store",
    });
    if (!res.ok) {
      setAuthed(false);
      localStorage.removeItem("admin-secret");
      return;
    }
    const data = (await res.json()) as { nominations: Nomination[]; leads: Lead[] };
    setNoms(data.nominations);
    setLeads(data.leads);
    setAuthed(true);
    localStorage.setItem("admin-secret", s);
  }

  async function roast(target: string) {
    setBusy(target);
    setLog((l) => [`roasting ${target}…`, ...l]);
    try {
      const res = await fetch("/api/roast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ url: target }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "failed");
      setLog((l) => [`✓ ${target} → /r/${data.id}`, ...l]);
    } catch (err) {
      setLog((l) => [
        `✗ ${target}: ${err instanceof Error ? err.message : "failed"}`,
        ...l,
      ]);
    } finally {
      setBusy(null);
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-md px-6 py-24">
        <h1 className="text-xl font-semibold">Chappie&rsquo;s control room</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void load(secret);
          }}
          className="mt-6 flex gap-3"
        >
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="admin secret"
            className="flex-1 rounded-md border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[var(--gold)]"
          />
          <button className="rounded-md bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-black">
            Enter
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-2xl font-semibold">Chappie&rsquo;s control room</h1>

      <section className="card mt-8 rounded-2xl p-6">
        <p className="mono mb-3 text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
          Publish a roast (today&rsquo;s victims: 2)
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) void roast(url.trim());
          }}
          className="flex gap-3"
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="victim.com"
            className="flex-1 rounded-md border border-white/15 bg-black/40 px-4 py-3 text-sm outline-none focus:border-[var(--gold)]"
          />
          <button
            disabled={!!busy}
            className="rounded-md bg-[var(--gold)] px-5 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            {busy ? "Roasting…" : "Roast →"}
          </button>
        </form>
        {log.length > 0 && (
          <ul className="mono mt-4 space-y-1 text-xs text-white/70">
            {log.slice(0, 6).map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-6 rounded-2xl p-6">
        <p className="mono mb-3 text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
          Nominations · {noms.length}
        </p>
        {noms.length === 0 ? (
          <p className="text-sm text-white/60">Nobody has snitched yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {noms.map((n, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{n.url}</p>
                  <p className="mono text-xs text-white/50">
                    {n.email} · {new Date(n.at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => void roast(n.url)}
                  disabled={!!busy}
                  className="shrink-0 rounded-md border border-[var(--gold)]/50 px-4 py-2 text-xs text-[var(--gold)] hover:bg-[var(--gold)]/10 disabled:opacity-50"
                >
                  Roast it
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card mt-6 rounded-2xl p-6">
        <p className="mono mb-3 text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
          Leads (unlocked fix lists) · {leads.length}
        </p>
        {leads.length === 0 ? (
          <p className="text-sm text-white/60">No unlocks yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {leads.map((l, i) => (
              <li key={i} className="py-3">
                <p className="text-sm">
                  {l.email}{" "}
                  <span className="text-white/50">
                    → {l.site} ({l.score}/100)
                  </span>
                </p>
                <p className="mono text-xs text-white/50">
                  {new Date(l.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
