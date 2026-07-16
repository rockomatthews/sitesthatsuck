import Link from "next/link";
import "./fx/fx.css";
import { ShaderHero, CursorGlow } from "./fx/ShowcaseClient";
import ChappieHero from "./fx/ChappieHero";
import { AutoLaugh } from "./AutoLaugh";
import { Nominate } from "./Nominate";
import { listRoasts } from "./lib/store";
import { scoreLabel } from "./lib/roast";

// Two victims a day, hand-picked. The homepage is today's episode.
export const revalidate = 300;

export default async function Home() {
  const roasts = await listRoasts(14);
  const today = roasts.slice(0, 2);
  const archive = roasts.slice(2);

  return (
    <main className="relative">
      <CursorGlow />
      <AutoLaugh />

      <section className="relative flex min-h-[92vh] items-center overflow-hidden px-6 sm:px-10">
        <ShaderHero />
        <ChappieHero />
        <div className="pointer-events-none relative z-10 mx-auto w-full max-w-5xl">
          <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
            sites that suck · two victims a day · judged by an actual robot
          </p>
          <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight [text-shadow:0_2px_30px_rgba(11,11,12,0.6)] sm:text-7xl">
            Chappie found two sites today.{" "}
            <span className="sx-grad-text">They suck.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/90 [text-shadow:0_1px_16px_rgba(11,11,12,0.7)]">
            Every day an AI studio&rsquo;s seven personas pick two websites and
            take them apart — the design, the code, the speed, the copy. With
            receipts, a suck score, and the actual fixes. That&rsquo;s Chappie.
            He laughs because it&rsquo;s funny.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="mono mb-6 text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
            Today&rsquo;s roasts
          </p>
          {today.length === 0 ? (
            <p className="text-white/60">
              Chappie is choosing today&rsquo;s victims. Check back in an hour.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {today.map((r) => {
                const host = new URL(r.facts.finalUrl).hostname;
                return (
                  <Link
                    key={r.id}
                    href={`/r/${r.id}`}
                    className="card group rounded-2xl p-7 transition hover:border-[var(--gold)]/60"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-lg font-semibold">{host}</span>
                      <span className="text-4xl font-bold text-[var(--gold)]">
                        {r.roast.score}
                      </span>
                    </div>
                    <p className="mono mt-1 text-[11px] uppercase tracking-widest text-white/50">
                      {scoreLabel(r.roast.score)}
                    </p>
                    <p className="mt-4 leading-snug text-white/85">
                      &ldquo;{r.roast.verdict}&rdquo;
                    </p>
                    <p className="mono mt-5 text-xs text-[var(--gold)] opacity-0 transition group-hover:opacity-100">
                      hear Chappie say it →
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {archive.length > 0 && (
        <section className="px-6 py-10 sm:px-10">
          <div className="mx-auto max-w-5xl">
            <p className="mono mb-6 text-xs uppercase tracking-[0.3em] text-white/50">
              Previously roasted
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {archive.map((r) => {
                const host = new URL(r.facts.finalUrl).hostname;
                return (
                  <Link
                    key={r.id}
                    href={`/r/${r.id}`}
                    className="card flex items-center justify-between gap-3 rounded-xl px-5 py-4 transition hover:border-[var(--gold)]/60"
                  >
                    <span className="truncate text-sm text-white/85">{host}</span>
                    <span className="text-xl font-bold text-[var(--gold)]">
                      {r.roast.score}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <p className="mono mb-2 text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
            Nominate tomorrow&rsquo;s victim
          </p>
          <p className="mb-5 max-w-xl text-sm leading-relaxed text-white/75">
            Chappie picks two sites a day. Point him at one — yours if
            you&rsquo;re brave, a competitor&rsquo;s if you&rsquo;re honest —
            and he&rsquo;ll email you if it makes the show.
          </p>
          <Nominate />
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 sm:px-10">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <p className="max-w-lg text-sm leading-relaxed text-white/70">
            Built by{" "}
            <a
              href="https://chappieworks.com?utm_source=sitesthatsuck&utm_medium=home&utm_campaign=footer"
              className="text-[var(--gold)] hover:underline"
            >
              Chappie Works
            </a>{" "}
            — the AI studio that ships sites that don&rsquo;t suck for $99.
          </p>
          <p className="mono text-xs text-white/40">
            roasts are opinions · fixes are facts
          </p>
        </div>
      </section>
    </main>
  );
}
