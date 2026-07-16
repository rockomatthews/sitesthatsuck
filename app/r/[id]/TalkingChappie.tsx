"use client";

/* Chappie narrates the roast. The laugh clip IS his talking animation — he
   giggles his way through your site's problems while the voice plays. Slim
   scene (no environment rig) so the roast page stays light; model + clips are
   already cached if the visitor came from the homepage. */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

const TalkingScene = dynamic(() => import("./TalkingScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <span className="mono text-[10px] uppercase tracking-[0.3em] text-[var(--gold)]/60">
        waking chappie…
      </span>
    </div>
  ),
});

export function TalkingChappie({ roastId }: { roastId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "talking" | "error">(
    "idle",
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      window.dispatchEvent(new CustomEvent("chappie-talk-stop"));
    },
    [],
  );

  async function toggle() {
    if (state === "talking") {
      audioRef.current?.pause();
      audioRef.current = null;
      window.dispatchEvent(new CustomEvent("chappie-talk-stop"));
      setState("idle");
      return;
    }
    setState("loading");
    try {
      if (!urlRef.current) {
        const res = await fetch(`/api/voice/${roastId}`);
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? "voice failed");
        urlRef.current = data.url;
      }
      const audio = new Audio(urlRef.current);
      audioRef.current = audio;
      audio.onended = () => {
        window.dispatchEvent(new CustomEvent("chappie-talk-stop"));
        setState("idle");
      };
      await audio.play();
      window.dispatchEvent(new CustomEvent("chappie-talk-start"));
      setState("talking");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  const label = useMemo(() => {
    switch (state) {
      case "loading":
        return "Chappie is clearing his throat…";
      case "talking":
        return "⏸ Okay okay, Chappie stops";
      case "error":
        return "Chappie lost his voice — try again";
      default:
        return "▶ Hear Chappie say it";
    }
  }, [state]);

  return (
    <div className="mt-8 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="h-32 w-28 shrink-0 overflow-hidden rounded-xl bg-black/30">
        <Suspense fallback={null}>
          <TalkingScene />
        </Suspense>
      </div>
      <div className="min-w-0">
        <button
          onClick={() => void toggle()}
          disabled={state === "loading"}
          className="rounded-md bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-60"
        >
          {label}
        </button>
        <p className="mono mt-2 text-[11px] leading-relaxed text-white/45">
          Chappie reads the verdict out loud. He will laugh. It&rsquo;s not
          personal. (It&rsquo;s a little personal.)
        </p>
      </div>
    </div>
  );
}
