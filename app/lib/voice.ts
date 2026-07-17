// Chappie's voice — an ORIGINAL robot voice with a South African accent via
// steerable TTS instructions. Deliberately NOT a clone of any actor: the
// accent + the third-person diction are the character; the timbre is ours.
// Generated lazily per roast, cached in blob.

import { put, list } from "@vercel/blob";

import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, rm, readFile, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// v3: TTS alone barely moved the needle (the model largely ignores accent/
// timbre steering), so the ROBOT is now made mechanically — ffmpeg pitches the
// voice up (younger) and runs a robotizer chain (flanger + bitcrush + metallic
// slapback). Bumping the prefix regenerates every cached voice.
const VOICE_KEY = (id: string) => `voices/v4/${id}.mp3`;

// v4: v3's coral base pitched +18% read as female. Now a young MALE base
// (ash) with only a gentle +7% lift — boyish, not girlish — then robotize.
const ROBOT_FILTER =
  "asetrate=24000*1.07,aresample=24000,atempo=0.9346," +
  "flanger=depth=6:regen=40:speed=0.6," +
  "acrusher=bits=10:mode=log:aa=1:mix=0.35," +
  "aecho=0.9:0.4:8:0.35," +
  "loudnorm=I=-16:TP=-1.5";

async function robotize(mp3: Buffer): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(tmpdir(), "voice-"));
  const inPath = path.join(workDir, "in.mp3");
  const outPath = path.join(workDir, "out.mp3");
  try {
    await writeFile(inPath, mp3);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("robotize timeout (30s)")),
        30000,
      );
      ffmpeg(inPath)
        .audioFilters(ROBOT_FILTER)
        .format("mp3")
        .on("end", () => {
          clearTimeout(timeout);
          resolve();
        })
        .on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        })
        .save(outPath);
    });
    return await readFile(outPath);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

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
      // ash = young MALE base; a gentle pitch lift keeps him boyish without
      // tipping feminine. The robot comes from ffmpeg after.
      voice: "ash",
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
  let mp3: Buffer = Buffer.from(await res.arrayBuffer());
  try {
    mp3 = await robotize(mp3);
  } catch (err) {
    // A failed robotize still ships the plain take — never silence.
    console.error(
      "[sitesthatsuck] robotize failed, using raw tts",
      err instanceof Error ? err.message : err,
    );
  }
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
