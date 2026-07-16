import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readRoast } from "../../lib/store";
import { scoreLabel } from "../../lib/roast";
import { UnlockFixes } from "./UnlockFixes";
import { ShareRow } from "./ShareRow";
import { TalkingChappie } from "./TalkingChappie";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const rec = await readRoast(id);
  if (!rec) return { title: "Roast not found" };
  const host = new URL(rec.facts.finalUrl).hostname;
  const title = `${host} scored ${rec.roast.score}/100 — ${scoreLabel(rec.roast.score)}`;
  return {
    title,
    description: rec.roast.verdict,
    openGraph: {
      title,
      description: rec.roast.verdict,
      images: [`/r/${id}/og`],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RoastPage({ params }: Props) {
  const { id } = await params;
  const rec = await readRoast(id);
  if (!rec) notFound();
  const { roast, facts } = rec;
  const host = new URL(facts.finalUrl).hostname;

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="mono text-xs text-[var(--gold)] hover:underline">
        ← roast another site
      </Link>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
          Chappie&rsquo;s verdict on {host}
        </p>
        <div className="mt-6 flex items-end gap-4">
          <span className="text-7xl font-bold leading-none text-[var(--gold)]">
            {roast.score}
          </span>
          <div className="pb-1">
            <span className="mono text-sm text-white/60">/100 suck score</span>
            <p className="text-lg font-semibold">{scoreLabel(roast.score)}</p>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-semibold leading-snug">
          &ldquo;{roast.verdict}&rdquo;
        </h1>
        <p className="mt-4 leading-relaxed text-white/85">{roast.chappie}</p>

        <TalkingChappie roastId={id} />

        <dl className="mt-8 space-y-4 border-t border-white/10 pt-6 text-sm">
          {[
            ["GLASS · design", roast.glass],
            ["FORGE · engineering", roast.forge],
            ["SKEPTIC · the copy", roast.skeptic],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="mono text-[11px] uppercase tracking-widest text-[var(--gold)]">
                {k}
              </dt>
              <dd className="mt-1 text-white/80">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mono mt-8 grid grid-cols-2 gap-2 border-t border-white/10 pt-6 text-[11px] text-white/50 sm:grid-cols-4">
          <span>⏱ {facts.responseMs}ms response</span>
          <span>📦 {(facts.htmlBytes / 1024).toFixed(0)}KB HTML</span>
          <span>🖼 {facts.imgMissingAlt}/{facts.imgCount} imgs no alt</span>
          <span>{facts.generator ? `🔧 ${facts.generator}` : "🔧 stack unknown"}</span>
        </div>
      </div>

      <ShareRow id={id} host={host} score={roast.score} verdict={roast.verdict} />

      <UnlockFixes id={id} fixCount={roast.fixes.length} />

      <p className="mono mt-12 text-center text-xs text-white/40">
        Roasted by{" "}
        <a
          href="https://chappieworks.com?utm_source=sitesthatsuck&utm_medium=roast&utm_campaign=footer"
          className="text-[var(--gold)] hover:underline"
        >
          Chappie Works
        </a>{" "}
        — the AI studio that builds sites that don&rsquo;t suck. $99.
      </p>
    </main>
  );
}
