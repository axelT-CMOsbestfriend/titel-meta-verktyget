// Hämtar titel, meta description och några grannar från en sida, för titel- och meta-verktyget.
// Den säkra hämtningen ligger i safe-fetch.mjs.

import { safeFetch, normalizeUrl, UserError, M } from "./safe-fetch.mjs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

const clean = (s) => (s == null ? null : decode(s).replace(/\s+/g, " ").trim());

// Läser content från första <meta> där attr=value, oavsett ordning på attributen
function meta(head, attr, value) {
  for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
    const a = tag.match(new RegExp(`\\b${attr}\\s*=\\s*(["'])(.*?)\\1`, "i"));
    if (!a || a[2].toLowerCase() !== value) continue;
    const c = tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i);
    return c ? clean(c[2]) : "";
  }
  return null;
}

function link(head, rel) {
  for (const tag of head.match(/<link\b[^>]*>/gi) || []) {
    const r = tag.match(/\brel\s*=\s*(["'])(.*?)\1/i);
    if (!r || !r[2].toLowerCase().split(/\s+/).includes(rel)) continue;
    return tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] ?? null;
  }
  return null;
}

export function extract(html, pageUrl) {
  const head = html.split(/<\/head>/i)[0];
  const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => clean(m[1]));
  const descriptions = (head.match(/<meta\b[^>]*>/gi) || []).filter((t) => /\bname\s*=\s*(["'])description\1/i.test(t)).length;
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const icon = link(head, "icon") || link(head, "shortcut") || "/favicon.ico";
  const canonical = link(head, "canonical");
  const abs = (h) => {
    try { return new URL(decode(h), pageUrl).href; } catch { return null; }
  };
  return {
    title: titles[0] ?? null,
    titleCount: titles.length,
    description: meta(head, "name", "description"),
    descriptionCount: descriptions,
    ogTitle: meta(head, "property", "og:title"),
    ogDescription: meta(head, "property", "og:description"),
    siteName: meta(head, "property", "og:site_name"),
    robots: meta(head, "name", "robots"),
    lang: head.match(/<html\b[^>]*\blang\s*=\s*(["'])(.*?)\1/i)?.[2] ?? null,
    h1: h1 ? clean(h1.replace(/<[^>]+>/g, " ")) : null,
    canonical: canonical ? abs(canonical) : null,
    favicon: abs(icon),
  };
}

export default async (req) => {
  const input = new URL(req.url).searchParams.get("url");
  try {
    const u = normalizeUrl(input);
    const res = await safeFetch(u.href);
    if (res.status >= 400) throw new UserError(M.err.status(res.status));
    const type = res.headers.get("content-type") || "";
    if (type && !/html|xml/i.test(type)) throw new UserError("Adressen pekar inte på en HTML-sida.");
    return json({ url: res.url, status: res.status, ...extract(res.body, res.url) });
  } catch (e) {
    if (e instanceof UserError) return json({ error: e.message }, 422);
    if (e?.name === "AbortError" || e?.cause) {
      let host = "sajten";
      try { host = normalizeUrl(input).hostname; } catch {}
      return json({ error: M.err.unreachable(host, 9) }, 502);
    }
    console.error(e);
    return json({ error: "Något gick fel. Försök igen om en stund." }, 500);
  }
};

export const config = { path: "/api/meta-fetch" };
