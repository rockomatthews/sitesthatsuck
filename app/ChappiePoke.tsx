"use client";

import { useRef, useState } from "react";

/* Poke Chappie. Odd pokes: he yells a comment about a site he just reviewed
   (random from today's roasts, yell/yelling clip). Even pokes: the CHARGE and
   the house line — follow Chappie on X, don't steal Daddy's car. Audio is a
   cached bark mp3; the speech bubble carries the words either way. */

export type PokeRoast = { id: string; host: string; score: number };

const X_URL = "https://x.com/chappieworks";

export function ChappiePoke({ roasts }: { roasts: PokeRoast[] }) {
  const pokes = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const [bubble, setBubble] = useState<{ text: string; follow: boolean } | null>(
    null,
  );

  async function poke() {
    pokes.current += 1;
    const isFollow = pokes.current % 2 === 0;

    // animation first — instant feedback while the bark fetches
    const anim = isFollow
      ? "charge"
      : Math.random() < 0.5
        ? "yell"
        : "yelling";
    window.dispatchEvent(new CustomEvent("chappie-play", { detail: { name: anim } }));

    // pick the words
    let query: string;
    let fallbackText: string;
    if (isFollow || roasts.length === 0) {
      query = "kind=follow";
      fallbackText =
        "Follow Chappie on X for more site roasts... and don't steal Daddy's car! Show respect!";
    } else {
      const r = roasts[Math.floor(Math.random() * roasts.length)];
      query = `id=${r.id}`;
      fallbackText = `Chappie just looked at ${r.host}. ${r.score} out of one hundred.`;
    }

    // show the bubble immediately with the fallback; upgrade when audio lands
    window.clearTimeout(hideTimer.current);
    setBubble({ text: fallbackText, follow: isFollow || roasts.length === 0 });

    try {
      const res = await fetch(`/api/bark?${query}`);
      const data = (await res.json()) as { url?: string; text?: string };
      if (data.text) {
        setBubble({ text: data.text, follow: isFollow || roasts.length === 0 });
      }
      if (data.url) {
        audioRef.current?.pause();
        const audio = new Audio(data.url);
        audioRef.current = audio;
        void audio.play().catch(() => {});
      }
    } catch {
      /* bubble already showing — silence is fine */
    }

    hideTimer.current = window.setTimeout(() => setBubble(null), 9000);
  }

  return (
    <>
      {/* the touchable Chappie zone — right side of the hero where he stands */}
      <button
        type="button"
        aria-label="Poke Chappie"
        onClick={() => void poke()}
        className="absolute inset-y-0 right-0 z-20 w-[42%] cursor-pointer bg-transparent sm:w-[38%]"
      />
      {bubble && (
        // beside his shoulder, never over his face — tail points right at him
        <div className="pointer-events-auto absolute left-4 right-4 top-[6%] z-30 rounded-2xl rounded-br-sm border border-[var(--gold)]/40 bg-black/85 p-4 shadow-2xl backdrop-blur sm:left-auto sm:right-[36%] sm:top-[16%] sm:max-w-xs">
          <p className="text-sm leading-relaxed text-white/90">{bubble.text}</p>
          {bubble.follow && (
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mono mt-2 inline-block text-xs text-[var(--gold)] underline underline-offset-4 hover:opacity-80"
            >
              @chappieworks on 𝕏 →
            </a>
          )}
        </div>
      )}
    </>
  );
}
