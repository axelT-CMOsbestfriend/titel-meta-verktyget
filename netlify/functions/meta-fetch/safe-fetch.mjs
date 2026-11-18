// Säker hämtning: släpper bara igenom publika adresser och validerar varje redirect.
// Samma kod som GEO-testet i axeltuvemo-geo. Inga beroenden, bara Node 18+.

import { lookup } from "node:dns/promises";
import net from "node:net";

export const M = {
  err: {
    noUrl: "Skriv in en webbadress.",
    invalidUrl: "Ogiltig webbadress.",
    onlyHttp: "Bara http och https stöds.",
    noPort: "Ange adressen utan portnummer.",
    ip: "Ange ett domännamn, inte en IP-adress.",
    notPublic: "Det där ser inte ut som en publik domän.",
    dns: (h) => `Hittar inte domänen ${h}. Stavade du rätt?`,
    internal: "Domänen pekar på en intern adress.",
    redirectScheme: "Sajten skickar vidare till en konstig adress.",
    redirects: "För många omdirigeringar.",
    unreachable: (h, s) => `Kunde inte nå ${h}. Den svarade inte inom ${s} sekunder eller stoppar automatiska besök.`,
    status: (c) => `Sajten svarade med felkod ${c}. Den kan blockera automatiska besök.`,
  },
};

const UA = "AxelTuvemoMetaCheck/1.0 (+https://axeltuvemo.com/)";
const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 9000;


export class UserError extends Error {}

// ---------- Säkerhet: släpp bara igenom publika adresser ----------

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80");
}

async function assertPublicHost(hostname) {
  if (net.isIP(hostname)) throw new UserError(M.err.ip);
  if (!hostname.includes(".") || hostname.endsWith(".local") || hostname.endsWith(".internal")) throw new UserError(M.err.notPublic);
  // Bara för lokal test bakom proxy utan DNS. Sätts aldrig på Netlify.
  if (process.env.SKIP_DNS === "1") return;
  const addrs = await resolveHost(hostname);
  if (!addrs.length) throw new UserError(M.err.dns(hostname));
  if (addrs.some((ip) => isPrivateIp(ip))) throw new UserError(M.err.internal);
}

// Node's resolver where there is one. Cloudflare Workers (axeltuvemo.com/geo)
// can lack it, so fall back to DNS over HTTPS there.
async function resolveHost(hostname) {
  try {
    return (await lookup(hostname, { all: true })).map((a) => a.address);
  } catch (e) {
    if (["ENOTFOUND", "ENODATA", "ESERVFAIL", "EAI_AGAIN"].includes(e?.code)) return [];
  }
  const ask = async (type) => {
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`, {
        headers: { accept: "application/dns-json" },
      });
      const data = await res.json();
      return (data.Answer || []).filter((a) => a.type === (type === "A" ? 1 : 28)).map((a) => a.data);
    } catch {
      return [];
    }
  };
  return [...(await ask("A")), ...(await ask("AAAA"))];
}

export function normalizeUrl(input) {
  let raw = String(input || "").trim();
  if (!raw) throw new UserError(M.err.noUrl);
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) throw new UserError(M.err.onlyHttp);
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new UserError(M.err.invalidUrl);
  }
  if (u.port && !["80", "443"].includes(u.port)) throw new UserError(M.err.noPort);
  u.hash = "";
  return u;
}

// Följer redirects manuellt så att varje steg valideras.
export async function safeFetch(url, maxRedirects = 5) {
  let current = new URL(url);
  const started = Date.now();
  for (let i = 0; i <= maxRedirects; i++) {
    await assertPublicHost(current.hostname);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: ctrl.signal,
        headers: { "user-agent": UA, accept: "text/html,text/plain,application/xml;q=0.9,*/*;q=0.5" },
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location"), current);
      if (!["http:", "https:"].includes(current.protocol)) throw new UserError(M.err.redirectScheme);
      continue;
    }
    const body = await readCapped(res);
    return { status: res.status, url: current.href, headers: res.headers, body, ms: Date.now() - started };
  }
  throw new UserError(M.err.redirects);
}

async function readCapped(res) {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BYTES) {
      reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
}
