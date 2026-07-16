"use client";

import { useEffect, useState } from "react";

// Share mechanics — the whole point. One-tap X share with pre-written copy,
// plus copy-link. The OG card does the visual work wherever it lands.
export function ShareRow({
  id,
  host,
  score,
  verdict,
}: {
  id: string;
  host: string;
  score: number;
  verdict: string;
}) {
  const [copied, setCopied] = useState(false);
  // Origin is browser-only — resolve after mount so SSR and client render the
  // same tree (relative URL first paint, absolute once hydrated).
  const [url, setUrl] = useState(`/r/${id}`);
  useEffect(() => {
    setUrl(`${window.location.origin}/r/${id}`);
  }, [id]);
  const text = `An AI just roasted ${host}: ${score}/100 suck score.\n\n"${verdict}"\n\n`;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md border border-white/15 px-5 py-2.5 text-sm transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
      >
        Post the roast on 𝕏
      </a>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="rounded-md border border-white/15 px-5 py-2.5 text-sm transition hover:border-[var(--gold)] hover:text-[var(--gold)]"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      <span className="mono text-xs text-white/40">
        roast a competitor. or your boss&rsquo;s site.
      </span>
    </div>
  );
}
