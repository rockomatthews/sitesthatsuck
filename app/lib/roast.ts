import Anthropic from "@anthropic-ai/sdk";
import type { SiteFacts } from "./inspect";

// The roast brain. Chappie speaks in third person, always — "Chappie thinks",
// "Chappie wants", "Chappie cannot fix ugly." Childlike but devastating. The
// other personas get one line each. Roast the WORK, never the person: no
// slurs, no personal attacks, no mocking prices/size of business — only the
// craft (design, copy, speed, SEO).

export type Roast = {
  score: number; // 0-100, higher = sucks more
  verdict: string; // one savage headline, Chappie voice
  chappie: string; // main roast paragraph, Chappie voice
  glass: string; // design one-liner
  forge: string; // engineering one-liner
  skeptic: string; // copy/positioning one-liner
  fixes: string[]; // 5-8 genuinely useful fixes (the email-gated goods)
};

const SYSTEM = `You are Chappie, the robot mascot of an AI web studio, roasting websites on sitesthatsuck. You ALWAYS refer to yourself in the third person: "Chappie thinks...", "Chappie wants to like this site, but...", "Chappie has seen government forms with more personality." Your tone: childlike, blunt, weirdly sweet, devastating. Funny beats mean.

Three teammates each add ONE line in their own voice:
- Glass (design snob, dry): roasts the visuals.
- Forge (staff engineer, terse): roasts the tech — speed, bloat, missing meta.
- Skeptic (devil's advocate): roasts the copy/positioning — what the site fails to say.

HARD RULES:
- Roast the WORK, never the human. No profanity stronger than "sucks"/"hell". No mocking the business's size, prices, industry, or people. Nothing about protected classes. If the site is actually good, say so — a low score with genuine praise is a valid roast.
- Every claim must trace to the provided facts. Do not invent numbers.
- fixes must be genuinely actionable and specific to the facts — this is the paid-quality advice that makes the roast credible.

Respond with ONLY valid JSON: {"score": number 0-100 (higher = worse site), "verdict": string (<=90 chars, Chappie voice), "chappie": string (2-4 sentences), "glass": string, "forge": string, "skeptic": string, "fixes": string[5-8]}`;

export async function generateRoast(facts: SiteFacts): Promise<Roast> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1200,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Roast this website.\n\nFACTS:\n${JSON.stringify(facts, null, 2)}`,
      },
    ],
  });

  const block = msg.content[0];
  const text = block.type === "text" ? block.text : "";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const r = JSON.parse(json) as Roast;

  // Clamp + sanity so a weird generation can't break the card.
  r.score = Math.max(0, Math.min(100, Math.round(r.score)));
  r.fixes = (r.fixes ?? []).slice(0, 8);
  return r;
}

export function scoreLabel(score: number): string {
  if (score >= 90) return "Chappie is calling the authorities";
  if (score >= 75) return "This site sucks";
  if (score >= 55) return "Sucks a medium amount";
  if (score >= 35) return "Almost doesn't suck";
  if (score >= 15) return "Chappie is mildly impressed";
  return "Chappie approves. Rare.";
}
