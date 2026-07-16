// Chappie's voice — an ORIGINAL robot voice with a South African accent via
// steerable TTS instructions. Deliberately NOT a clone of any actor: the
// accent + the third-person diction are the character; the timbre is ours.
// Generated lazily per roast, cached in blob.

import { put, list } from "@vercel/blob";

// v2 prefix: bumping this regenerates every cached voice with the new
// instructions (old v1 files just go stale in blob).
const VOICE_KEY = (id: string) => `voices/v2/${id}.mp3`;

const VOICE_INSTRUCTIONS = `Voice identity: a YOUNG robot — sounds like an excitable teenage boy made of metal. Higher-pitched, boyish, never deep or adult.
Accent: THICK South African English (Johannesburg) — flat clipped vowels ("yes" sounds like "yis", "man" like "mahn"), clipped consonants, rising inflection at phrase ends. The accent must be unmistakable in every sentence.
Timbre: distinctly ROBOTIC and synthesized — metallic edge, slightly flattened digital tone, tiny mechanical stutters on some word starts, like speech through a small speaker.
Tone: childlike, mischievous, giggly — he finds bad websites genuinely funny, like a kid who can't hold it in.
Delivery: quick and bouncy, small giggles and chuckles breaking through between phrases. Punchlines land with a tiny beat before them.`;

export async function getOrCreateVoice(
  id: string,
  script: string,
): Promise<{ url: string } | { error: string }> {
  return ttsCached(VOICE_KEY(id), script);
}

// Generic cached TTS: any blob key, any script — used for the roast
// narrations and the homepage barks.
export async function ttsCached(
  key: string,
  script: string,
): Promise<{ url: string } | { error: string }> {
  // cached?
  const { blobs } = await list({ prefix: key });
  const hit = blobs.find((b) => b.pathname === key);
  if (hit) return { url: hit.url };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "voice offline (no OPENAI_API_KEY)" };

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: script.slice(0, 2000),
      instructions: VOICE_INSTRUCTIONS,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("[sitesthatsuck] tts failed", res.status, t.slice(0, 200));
    return { error: `tts ${res.status}` };
  }
  const mp3 = Buffer.from(await res.arrayBuffer());
  const blob = await put(key, mp3, {
    access: "public",
    contentType: "audio/mpeg",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return { url: blob.url };
}

// What Chappie actually says out loud: verdict + main roast, in his voice.
export function voiceScript(verdict: string, chappie: string): string {
  return `${verdict}. ... ${chappie}`;
}
