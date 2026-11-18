// Titel & meta-verktyget. Texterna står här, logiken i app.js.

import { siteHeader, siteFooter, fonts, PERSON, MAIN, GEO } from "./chrome.mjs";

export const SITE = process.env.SITE || "https://meta-verktyget.axeltuvemo.com";

const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const safeJson = (o, indent) => JSON.stringify(o, null, indent).replace(/</g, "\\u003c");

export const TITLE_META_SV = {
  lang: "sv",
  path: "/",
  updated: "2026-11-18",
  metaTitle: "Titel & meta-verktyg: förhandsvisa i Google | Axel Tuvemo",
  description: "Gratis verktyg för title och meta description. Hämta sidans nuvarande texter, se pixelbredd och hur sökresultatet ser ut på dator och mobil.",
  appName: "Titel & meta-verktyget",
  faq: [
    {
      q: "Hur lång ska en title vara?",
      a: "Sikta på 50–60 tecken. Google mäter egentligen i pixlar och kapar titeln när den blir bredare än ungefär 580 px på dator, så en titel med många breda bokstäver (W, M, versaler) får plats med färre tecken. Verktyget visar båda måtten.",
    },
    {
      q: "Hur lång ska en meta description vara?",
      a: "Ungefär 120–156 tecken. Kortare än så lämnar tom yta i sökresultatet, längre klipps av med tre punkter. På dator brukar gränsen ligga runt 920 px, på mobil får texten plats på några rader till.",
    },
    {
      q: "Varför visar Google en annan titel än den jag skrev?",
      a: "Google skriver om titlar när de bedömer att sidans title inte beskriver innehållet, till exempel om den är för lång, fylld med sökord eller likadan på många sidor. Enligt Google Search Central används title-elementet i ungefär 87 procent av fallen. En kort, unik och ärlig titel är det bästa sättet att få behålla din egen.",
    },
    {
      q: "Påverkar meta description rankingen?",
      a: "Nej, inte direkt. Google har sagt att meta description inte används som rankingsignal. Den påverkar däremot hur många som klickar, och Google fetstilar orden som matchar sökningen. Därför lönar det sig att få med sökordet.",
    },
    {
      q: "Varför syns inte min meta description i sökresultatet?",
      a: "Google väljer ofta en egen textbit från sidan när den matchar sökningen bättre. Det händer oftare på långa sidor som svarar på många olika frågor. En description som sammanfattar sidan och innehåller huvudsökordet ökar chansen att den används.",
    },
    {
      q: "Spelar title och meta description roll för AI-sök?",
      a: "Titeln gör det. När ChatGPT, Perplexity och Google AI Mode visar sina källor är det oftast sidans titel som står på länken, så en tydlig titel avgör om någon klickar vidare. Meta description är mindre viktig där. Vill du veta hur redo hela sajten är för AI-sök kan du köra GEO-testet.",
    },
  ],
};

export function renderTitleMeta(T) {
  const url = SITE + T.path;
  const jsonld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: T.appName,
        url,
        description: T.description,
        inLanguage: T.lang,
        applicationCategory: "SEO tool",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" },
        author: { "@id": PERSON["@id"] },
        dateModified: T.updated,
      },
      PERSON,
      {
        "@type": "FAQPage",
        inLanguage: T.lang,
        mainEntity: T.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return `<!doctype html>
<html lang="${T.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${T.metaTitle}</title>
<meta name="description" content="${attr(T.description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="sv_SE">
<meta property="og:title" content="${attr(T.appName)}: skriv titlar och descriptions som får klick">
<meta property="og:description" content="${attr(T.description)}">
<meta property="og:image" content="${GEO}/og.png">
<meta property="og:url" content="${url}">
${fonts}
<link rel="stylesheet" href="/assets/base.css?v=${T.updated}">
<link rel="stylesheet" href="/assets/tools.css?v=${T.updated}">
<script type="application/ld+json">
${safeJson(jsonld, 2)}
</script>
</head>
<body class="tm">

${siteHeader({
  home: "/",
  links: [
    { href: GEO + "/", label: "Gratis GEO-test", cls: "hide-sm" },
    { href: GEO + "/aeo-guiden/", label: "AEO-guiden", cls: "hide-sm" },
    { href: T.path, label: "Titel & meta", cls: "hide-sm", current: true },
    { href: MAIN + "/", label: "axeltuvemo.com ↗", cls: "ext hide-sm" },
  ],
  extra: `<a class="btn" href="${GEO}/ai-synlighet/">Få hjälp</a>`,
})}

<main>
<section class="hero tm-hero">
  <div class="wrap">
    <div class="eyebrow">Gratis SEO-verktyg</div>
    <h1>Titlar som får <em>klicket</em></h1>
    <p class="lede">Skriv title och meta description och se direkt hur de ser ut i sökresultatet. Verktyget mäter i pixlar, precis som Google, så du vet var texten klipps.</p>

    <form class="check-form" id="fetchForm" novalidate>
      <label class="sr" for="tmUrl">Webbadress</label>
      <input id="tmUrl" name="url" type="text" inputmode="url" autocomplete="url" placeholder="dinsajt.se/sidan-du-vill-optimera" spellcheck="false">
      <button class="btn" id="fetchBtn" type="submit">Hämta titel & meta</button>
    </form>
    <p class="form-error" id="fetchError" role="alert"></p>
    <p class="tm-hint">Eller hoppa över det och skriv direkt nedan.</p>
  </div>
</section>

<section class="wrap tm-app" aria-label="Verktyget">
  <div class="tm-edit">
    <div class="tm-now" id="nowBox" hidden>
      <div class="eyebrow">Så ser sidan ut i dag</div>
      <dl id="nowList"></dl>
      <ul class="tm-flags" id="nowFlags"></ul>
      <button type="button" class="link-btn" id="resetBtn">Återställ till sidans texter</button>
    </div>

    <div class="tm-field">
      <label for="tmKw">Sökord <small>valfritt, används för kontrollerna och fetstilen</small></label>
      <input id="tmKw" type="text" placeholder="t.ex. takläggare stockholm" autocomplete="off">
    </div>

    <div class="tm-field">
      <div class="tm-label-row"><label for="tmTitle">Title</label><span class="tm-count" id="titleCount"></span></div>
      <textarea id="tmTitle" rows="2" placeholder="Takläggare i Stockholm: fast pris och 10 års garanti | Takbolaget"></textarea>
      <div class="tm-meter" aria-hidden="true"><i id="titleBar"></i><b class="tm-limit"></b></div>
      <p class="tm-status" id="titleStatus"></p>
    </div>

    <div class="tm-field">
      <div class="tm-label-row"><label for="tmDesc">Meta description</label><span class="tm-count" id="descCount"></span></div>
      <textarea id="tmDesc" rows="4" placeholder="Vi lägger om tak i hela Stockholm. Fast pris efter gratis besiktning, eget team och 10 års garanti. Boka en tid i dag."></textarea>
      <div class="tm-meter" aria-hidden="true"><i id="descBar"></i><b class="tm-limit"></b></div>
      <p class="tm-status" id="descStatus"></p>
    </div>

    <div class="tm-field">
      <label for="tmPageUrl">Adress som visas i resultatet</label>
      <input id="tmPageUrl" type="text" placeholder="https://dinsajt.se/sida/" spellcheck="false">
    </div>
  </div>

  <div class="tm-side">
    <div>
    <div class="tm-preview-head">
      <div class="eyebrow">Förhandsvisning</div>
      <div class="tm-tabs" role="tablist" aria-label="Enhet">
        <button type="button" role="tab" aria-selected="true" data-device="desktop">Dator</button>
        <button type="button" role="tab" aria-selected="false" data-device="mobile">Mobil</button>
      </div>
    </div>
    <div class="tm-serp-wrap">
      <div class="tm-serp desktop" id="serp">
        <div class="tm-src">
          <span class="tm-fav" id="serpFav"><img alt="" id="serpFavImg" hidden><span id="serpFavLetter">D</span></span>
          <span class="tm-src-txt"><span class="tm-site" id="serpSite">Din sajt</span><span class="tm-crumb" id="serpCrumb">https://dinsajt.se</span></span>
        </div>
        <a class="tm-title" id="serpTitle" href="#" tabindex="-1"></a>
        <p class="tm-desc" id="serpDesc"></p>
      </div>
    </div>
    <p class="tm-note">Ungefärlig bild av ett sökresultat. Google kan välja andra texter beroende på sökningen.</p>
    </div>

    <div class="tm-checks">
      <div class="tm-label-row"><div class="eyebrow">Kontroller</div><span class="tm-score" id="score"></span></div>
      <ul id="checks"></ul>
    </div>

    <div class="tm-code">
      <div class="tm-label-row"><div class="eyebrow">Klistra in i &lt;head&gt;</div></div>
      <div class="codebox"><pre id="code"></pre><button type="button" class="copy" id="copyCode">Kopiera</button></div>
      <div class="tm-actions">
        <button type="button" class="btn ghost" id="shareBtn">Kopiera länk till utkastet</button>
      </div>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap tm-guide">
    <div>
      <div class="eyebrow">Title</div>
      <h2>Så skriver du en bra titel</h2>
      <p>Titeln är det första någon läser i sökresultatet, och den står på fliken i webbläsaren. Den syns inte på själva sidan, men den gör mest för både ranking och klick av allt i &lt;head&gt;.</p>
      <ul class="tm-list">
        <li><b>Sökordet först.</b> Det som står i början läses, resten skummas.</li>
        <li><b>Unik för varje sida.</b> Tio sidor med samma titel tävlar mot varandra.</li>
        <li><b>Ett skäl att klicka.</b> Pris, garanti, antal, år. Något konkret.</li>
        <li><b>Varumärket sist.</b> Efter ett | eller ett kolon, om det får plats.</li>
        <li><b>Max cirka 580 px.</b> Brukar bli 50–60 tecken med mellanslag.</li>
      </ul>
    </div>
    <div>
      <div class="eyebrow">Meta description</div>
      <h2>Så skriver du en bra description</h2>
      <p>Meta description är den korta texten under länken. Den påverkar inte rankingen, men den är din annons i sökresultatet. Google fetstilar orden som matchar sökningen, så de sticker ut.</p>
      <ul class="tm-list">
        <li><b>Svara på sökningen.</b> Säg vad sidan ger, inte vad företaget tycker om sig själv.</li>
        <li><b>Få med sökordet.</b> Det blir fetstilat och syns.</li>
        <li><b>Avsluta med nästa steg.</b> Boka, läs, jämför, beställ.</li>
        <li><b>Unik för varje sida.</b> Annars väljer Google ofta en egen text.</li>
        <li><b>120–156 tecken.</b> Runt 920 px på dator.</li>
      </ul>
    </div>
  </div>
</section>

<section class="block" id="faq">
  <div class="wrap narrow">
    <div class="eyebrow">Vanliga frågor</div>
    <h2>Om title och meta description</h2>
    <div class="faq">
      ${T.faq.map((f) => `<details><summary><h3>${f.q}</h3></summary><p>${f.a}</p></details>`).join("\n      ")}
    </div>
  </div>
</section>

<section class="wrap">
  <div class="g-cta tm-cta">
    <div class="eyebrow">Nästa steg</div>
    <h2>Syns sajten i AI-sök också?</h2>
    <p>Titlarna är en bit. GEO-testet kollar resten på tio sekunder: om ChatGPT och Perplexity får läsa sajten, om strukturerad data finns och vad som saknas. Du får färdig kod för det som behöver fixas.</p>
    <div class="g-cta-row"><a class="btn accent" href="${GEO}/">Testa din sajt gratis →</a><a href="${GEO}/ai-synlighet/">Eller låt mig fixa det åt dig</a></div>
  </div>
</section>
</main>

${siteFooter(T.lang)}

<script src="/assets/app.js?v=${T.updated}" defer></script>
</body>
</html>
`;
}
