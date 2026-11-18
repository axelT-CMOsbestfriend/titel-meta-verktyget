// Bygger public/ från src/. Inga beroenden. Kör: node build.mjs
import { mkdir, writeFile, copyFile, rm } from "node:fs/promises";
import { renderTitleMeta, TITLE_META_SV, SITE } from "./src/page.mjs";

const OUT = "public";
const T = TITLE_META_SV;

await rm(OUT, { recursive: true, force: true });
await mkdir(`${OUT}/assets`, { recursive: true });
await writeFile(`${OUT}/index.html`, renderTitleMeta(T));
await copyFile("src/base.css", `${OUT}/assets/base.css`);
await copyFile("src/tools.css", `${OUT}/assets/tools.css`);
await copyFile("src/app.js", `${OUT}/assets/app.js`);
await writeFile(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`);
await writeFile(
  `${OUT}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${T.updated}</lastmod>
  </url>
</urlset>
`
);
console.log(`Byggde ${SITE}/ till ${OUT}/`);
