# Titel & meta-verktyget

Gratis verktyg för title och meta description, i samma stil som axeltuvemo.com.

- Hämtar sidans nuvarande title, description, H1, canonical och favicon
- Mäter bredden i pixlar, som Google: cirka 580 px för titeln och 920 px för beskrivningen
- Förhandsvisar sökresultatet på dator och mobil, med sökordet fetstilat
- Kontroller mot ett valfritt sökord (finns det, står det tidigt, versaler, upprepningar med mera)
- Färdig HTML att kopiera och en delbar länk till utkastet

## Struktur

- `src/page.mjs`: sidan, alla texter, FAQ och schema (WebApplication, FAQPage)
- `src/app.js`: klientkoden (mätning, förhandsvisning, kontroller)
- `src/base.css`, `src/tools.css`: grundstilen från axeltuvemo.com och verktygets egen stil
- `src/chrome.mjs`: sidhuvud och sidfot, länkar till GEO-sajten (`GEO`)
- `netlify/functions/meta-fetch/`: `/api/meta-fetch?url=`. `safe-fetch.mjs` släpper bara igenom publika adresser och validerar varje redirect
- `build.mjs`: bygger `public/` med index, robots.txt och sitemap. Inga beroenden

## Adress

Sajtens adress sätts med miljövariabeln `SITE` (standard `https://meta-verktyget.axeltuvemo.com`). Den används i canonical, schema och sitemap.

## Länkar in

- `?url=dinsajt.se/sida` hämtar sidan direkt
- `?t=…&d=…&k=…&u=…` öppnar ett sparat utkast (det är vad knappen "Kopiera länk till utkastet" skapar)

## Köra lokalt

```bash
npm run dev   # bygger och startar http://localhost:8888
```

Bakom en proxy utan DNS: `SKIP_DNS=1 npm run dev`. Sätt aldrig den på Netlify.

## Deploy

Koppla repot till Netlify. `netlify.toml` kör `node build.mjs`, publicerar `public/` och tar med funktionen.
