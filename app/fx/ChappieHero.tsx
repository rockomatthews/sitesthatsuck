"use client";

/* Client island: dynamically imports the R3F scene (ssr:false) so three.js +
   the GLB load only on this route. The run-across is done HERE, in CSS — the
   canvas renders Chappie centered/identity (the only transform a glTF skinned
   mesh survives), and we translate the whole canvas across the viewport. The
   inner wrapper mirrors (scaleX) so he faces his direction of travel. */

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

const RUN_MS = 2000; // matches RUN_MS in ChappieScene
const IDLE_X = "30%"; // rest position, right of the headline copy

const ChappieScene = dynamic(() => import("./ChappieScene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center">
      <span className="mono text-xs uppercase tracking-[0.3em] text-[var(--color-gold)]/70">
        loading 3D…
      </span>
    </div>
  ),
});

export default function ChappieHero() {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const backTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Chappie idles right-of-center by default (clear of the headline)
    if (outer.current) outer.current.style.transform = `translateX(${IDLE_X})`;

    function onRun(e: Event) {
      const dir = (e as CustomEvent).detail?.dir;
      const fromLeft = dir !== "right"; // "left" = enter from the left, travel right
      if (inner.current) {
        // mirror so he faces his direction of travel (3D rotation shatters the
        // skinned mesh, so we flip in CSS instead)
        inner.current.style.transform = fromLeft ? "scaleX(-1)" : "scaleX(1)";
      }
      const entry = fromLeft ? "-100%" : "100%";
      const exit = fromLeft ? "100%" : "-100%";
      const el = outer.current;
      if (!el) return;
      window.clearTimeout(backTimer.current);
      el.getAnimations().forEach((a) => a.cancel());
      // sweep across; opacity fades at the ends hide the off-screen entry/exit
      el.animate(
        [
          { transform: `translateX(${entry})`, opacity: 0, offset: 0 },
          { transform: `translateX(${entry})`, opacity: 1, offset: 0.12 },
          { transform: `translateX(0%)`, opacity: 1, offset: 0.5 },
          { transform: `translateX(${exit})`, opacity: 1, offset: 0.88 },
          { transform: `translateX(${exit})`, opacity: 0, offset: 1 },
        ],
        { duration: RUN_MS, easing: "linear", fill: "forwards" },
      );
      // settle back to center + face front for idle
      backTimer.current = window.setTimeout(() => {
        if (inner.current) inner.current.style.transform = "scaleX(1)";
        el.getAnimations().forEach((a) => a.cancel());
        el.style.transform = `translateX(${IDLE_X})`;
        el.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 300,
          fill: "forwards",
        });
      }, RUN_MS);
    }
    window.addEventListener("chappie-run", onRun);
    return () => {
      window.removeEventListener("chappie-run", onRun);
      window.clearTimeout(backTimer.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div ref={outer} className="h-full w-full will-change-transform">
        <div ref={inner} className="h-full w-full">
          <ChappieScene />
        </div>
      </div>
    </div>
  );
}
