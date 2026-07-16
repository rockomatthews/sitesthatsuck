import "./fx/fx.css";
import { ShaderHero, CursorGlow, RunControls } from "./fx/ShowcaseClient";
import ChappieHero from "./fx/ChappieHero";
import { RoastForm } from "./RoastForm";

export default function Home() {
  return (
    <main className="relative">
      <CursorGlow />
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 sm:px-10">
        <ShaderHero />
        <ChappieHero />
        <div className="pointer-events-none relative z-10 mx-auto w-full max-w-5xl">
          <p className="mono text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
            sites that suck · judged by an actual robot
          </p>
          <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight [text-shadow:0_2px_30px_rgba(11,11,12,0.6)] sm:text-7xl">
            Chappie thinks your site{" "}
            <span className="sx-grad-text">sucks.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/90 [text-shadow:0_1px_16px_rgba(11,11,12,0.7)]">
            Prove him wrong. Paste a URL and an AI studio&rsquo;s seven
            personas roast the design, the code, the speed and the copy — with
            a suck score, a card you can post, and the actual fixes.
          </p>
          <RoastForm />
          <div className="mt-8">
            <span className="pointer-events-auto">
              <RunControls />
            </span>
            <p className="mono mt-3 text-xs text-white/50">
              that&rsquo;s Chappie — live 3D, real-time. he does this while he judges.
            </p>
          </div>
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
            — the AI studio that ships sites that don&rsquo;t suck for $99,
            movies for $14.99, and custom agents for real money.
          </p>
          <p className="mono text-xs text-white/40">
            roasts are opinions · fixes are facts
          </p>
        </div>
      </section>
    </main>
  );
}
