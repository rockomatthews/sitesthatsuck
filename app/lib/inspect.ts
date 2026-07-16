// Fetches the victim's site and extracts the raw material for the roast:
// response time, page weight, title/meta/h1s, tech smells, and the visible
// copy. No headless browser in v1 — plain fetch keeps it fast and cheap; the
// screenshot pipeline can upgrade this later.

export type SiteFacts = {
  url: string;
  finalUrl: string;
  status: number;
  responseMs: number;
  htmlBytes: number;
  title: string;
  metaDescription: string;
  h1s: string[];
  hasViewport: boolean;
  hasOgImage: boolean;
  hasFavicon: boolean;
  imgCount: number;
  imgMissingAlt: number;
  scriptCount: number;
  inlineStyleCount: number;
  generator: string; // wix/squarespace/wordpress/etc if detectable
  visibleText: string; // first ~2500 chars of body copy for the roast
};

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function inspectSite(rawUrl: string): Promise<SiteFacts> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const u = new URL(url); // throws on garbage — caller returns 400

  // Refuse obvious SSRF bait: localhost, raw IPs, internal TLDs.
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    !host.includes(".")
  ) {
    throw new Error("that's not a public website");
  }

  const started = Date.now();
  const res = await fetch(u.toString(), {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; ChappieRoastBot/1.0; +https://chappiebarks.com)",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  });
  const html = (await res.text()).slice(0, 1_500_000);
  const responseMs = Date.now() - started;

  const pick = (re: RegExp): string => html.match(re)?.[1]?.trim() ?? "";
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = pick(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  ) || pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => stripTags(m[1]))
    .filter(Boolean)
    .slice(0, 5);

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const generator =
    pick(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)["']/i) ||
    (/(wix\.com|wixstatic)/i.test(html) ? "Wix" : "") ||
    (/squarespace/i.test(html) ? "Squarespace" : "") ||
    (/wp-content|wordpress/i.test(html) ? "WordPress" : "") ||
    (/cdn\.shopify/i.test(html) ? "Shopify" : "") ||
    (/__next|next\/static/i.test(html) ? "Next.js" : "");

  return {
    url: rawUrl,
    finalUrl: res.url || u.toString(),
    status: res.status,
    responseMs,
    htmlBytes: html.length,
    title,
    metaDescription,
    h1s,
    hasViewport: /<meta[^>]+name=["']viewport["']/i.test(html),
    hasOgImage: /<meta[^>]+property=["']og:image["']/i.test(html),
    hasFavicon: /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html),
    imgCount: imgs.length,
    imgMissingAlt: imgs.filter((t) => !/\balt=["'][^"']+["']/i.test(t)).length,
    scriptCount: (html.match(/<script\b/gi) ?? []).length,
    inlineStyleCount: (html.match(/style=["']/gi) ?? []).length,
    generator,
    visibleText: stripTags(html).slice(0, 2500),
  };
}
