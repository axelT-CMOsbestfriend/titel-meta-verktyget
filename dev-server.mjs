// Lokal server: statiska filer + /api/meta-fetch. Kör: npm run dev
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import metaFetch from "./netlify/functions/meta-fetch/meta-fetch.mjs";

const root = new URL("./public/", import.meta.url).pathname;
const types = { ".html": "text/html; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".css": "text/css", ".js": "text/javascript" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/meta-fetch") {
    const r = await metaFetch(new Request(url));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    return res.end(await r.text());
  }
  const file = normalize(join(root, url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  try {
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" }).end(await readFile(file));
  } catch {
    res.writeHead(404).end("Hittades inte");
  }
}).listen(process.env.PORT || 8888, () => console.log("http://localhost:" + (process.env.PORT || 8888)));
