"use client";

import { useEffect } from "react";

// No buttons — Chappie just is. He idles, and every so often something about
// the day's roasts gets him giggling again.
export function AutoLaugh() {
  useEffect(() => {
    const fire = () => window.dispatchEvent(new CustomEvent("chappie-laugh"));
    const first = window.setTimeout(fire, 3500);
    const loop = window.setInterval(fire, 13000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
    };
  }, []);
  return null;
}
