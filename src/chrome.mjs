// Sidhuvud och sidfot som delas av alla sidor, i samma stil som axeltuvemo.com.

export const MAIN = "https://axeltuvemo.com";
// Porträttet hämtas från huvudsidan. Lägg gärna en egen kopia i src/static/ och byt adress här.
export const PORTRAIT = MAIN + "/assets/axel-portrait-kpSHxvVB.webp";
export const GEO = "https://geo.axeltuvemo.com";
export const EMAIL = "hej@axeltuvemo.se";

// Personen bakom sajten, samma uppgifter som i huvudsidans schema
export const PERSON = {
  "@type": "Person",
  "@id": MAIN + "/#axel",
  name: "Axel Tuvemo",
  url: MAIN,
  jobTitle: "Brand & Growth Manager",
  email: "mailto:" + EMAIL,
  sameAs: ["https://substack.com/@axeltuvemo", "https://www.linkedin.com/in/axeltuvemo"],
};

const FOOT = {
  sv: { tagline: "GEO och AI-synlighet i Norden", read: "Läs vidare", geo: "GEO", test: "Gratis GEO-test", guide: "AEO-guiden", meta: "Titel & meta-verktyg", help: "Få hjälp", home: "axeltuvemo.com" },
  da: { tagline: "GEO og AI-synlighed i Norden", read: "Læs videre", geo: "GEO", test: "Gratis GEO-test", guide: "AEO-guiden (svensk)", meta: "Titel & meta-værktøj (svensk)", help: "Få hjælp", home: "axeltuvemo.com" },
  no: { tagline: "GEO og AI-synlighet i Norden", read: "Les videre", geo: "GEO", test: "Gratis GEO-test", guide: "AEO-guiden (svensk)", meta: "Tittel & meta-verktøy (svensk)", help: "Få hjelp", home: "axeltuvemo.com" },
  fi: { tagline: "GEO ja tekoälynäkyvyys Pohjoismaissa", read: "Lue lisää", geo: "GEO", test: "Ilmainen GEO-testi", guide: "AEO-opas (ruotsiksi)", meta: "Otsikko & meta -työkalu (ruotsiksi)", help: "Pyydä apua", home: "axeltuvemo.com" },
};

export const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Karla:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="icon" type="image/png" href="${MAIN}/favicon.png">
<link rel="apple-touch-icon" href="${MAIN}/favicon.png">`;

// links: [{ href, label, cls?, current? }], extra: html till höger (t.ex. språkval)
export function siteHeader({ home = "/", links = [], extra = "", sticky = false }) {
  return `<header class="site-top${sticky ? " sticky" : ""}">
  <div class="wrap">
    <a class="logo" href="${home}"><img src="${PORTRAIT}" alt="" width="48" height="48" onerror="this.remove()"><span>Axel Tuvemo</span><small>SEO</small></a>
    <nav class="top-nav" aria-label="Huvudmeny">
      ${links.map((l) => `<a href="${l.href}"${l.cls ? ` class="${l.cls}"` : ""}${l.current ? ' aria-current="page"' : ""}>${l.label}</a>`).join("\n      ")}
      ${extra}
    </nav>
  </div>
</header>`;
}

export function siteFooter(lang = "sv", { toolPath = GEO + "/" } = {}) {
  const t = FOOT[lang] || FOOT.sv;
  return `<footer class="site-foot">
  <div class="wrap">
    <div>
      <p class="name">Axel Tuvemo</p>
      <p class="tag">${t.tagline}</p>
    </div>
    <div>
      <p class="eyebrow">${t.read}</p>
      <ul>
        <li><a href="${MAIN}/">${t.home}</a></li>
        <li><a href="https://substack.com/@axeltuvemo" rel="noopener">Substack ↗</a></li>
        <li><a href="https://www.linkedin.com/in/axeltuvemo" rel="noopener">LinkedIn ↗</a></li>
        <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
      </ul>
    </div>
    <div>
      <p class="eyebrow">${t.geo}</p>
      <ul>
        <li><a href="${toolPath}">${t.test}</a></li>
        <li><a href="${GEO}/aeo-guiden/">${t.guide}</a></li>
        <li><a href="/">${t.meta}</a></li>
        <li><a href="${GEO}/ai-synlighet/">${t.help}</a></li>
        <li><a href="${GEO}/llms.txt">llms.txt</a></li>
      </ul>
      <p class="copy">© 2026 Axel Tuvemo</p>
    </div>
  </div>
</footer>`;
}
