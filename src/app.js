// Titel & meta-verktyget. Mäter texten i pixlar med samma typsnitt och storlek som
// ett sökresultat på dator (Arial 20 px för titeln, 14 px för beskrivningen).
(() => {
  const $ = (id) => document.getElementById(id);
  const LIMITS = {
    title: { px: 580, min: 30, max: 60 },
    desc: { px: 920, min: 120, max: 156 },
  };
  const SCALE = 1.15; // mätaren visar upp till 115 % av gränsen

  const f = { kw: $("tmKw"), title: $("tmTitle"), desc: $("tmDesc"), page: $("tmPageUrl"), url: $("tmUrl") };
  let device = "desktop";
  let original = null;

  const ctx = document.createElement("canvas").getContext("2d");
  const width = (text, size) => {
    ctx.font = `${size}px Arial, Helvetica, sans-serif`;
    return Math.round(ctx.measureText(text).width);
  };

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const norm = (s) => s.toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const kwWords = () => norm(f.kw.value).split(" ").filter((w) => w.length > 1);
  // Ord som gränsas av något som inte är bokstav eller siffra (fungerar för å, ä, ö)
  const wordRe = (w, flags = "i") => new RegExp(`(^|[^\\p{L}\\p{N}])(${reEsc(w)})(?=$|[^\\p{L}\\p{N}])`, flags + "u");

  // ---------- Mätare och status ----------

  function measure(kind) {
    const el = kind === "title" ? f.title : f.desc;
    const text = el.value.replace(/\s+/g, " ").trim();
    const L = LIMITS[kind];
    const px = width(text, kind === "title" ? 20 : 14);
    const chars = text.length;
    const bar = $(kind + "Bar");
    const meter = bar.parentElement;
    const status = $(kind + "Status");
    bar.style.width = Math.min(100, (px / L.px / SCALE) * 100) + "%";

    $(kind + "Count").innerHTML = `<b>${chars}</b> tecken · <b>${px}</b> av ${L.px} px`;

    let cls = "good", msg;
    if (!chars) { cls = ""; msg = kind === "title" ? "Skriv en titel för att se hur den ser ut." : "Skriv en beskrivning, annars väljer Google en egen text från sidan."; }
    else if (px > L.px) { cls = "bad"; msg = `För bred. Klipps efter ungefär ${cutAt(text, kind === "title" ? 20 : 14, L.px)} tecken, ta bort ${px - L.px} px.`; }
    else if (chars < L.min) { cls = "warn"; msg = `Lite kort. ${L.min - chars} tecken till ger mer plats att övertyga.`; }
    else if (chars > L.max) { cls = "warn"; msg = `Får plats i pixlar men är över ${L.max} tecken. Kan klippas på mobil eller i andra verktyg.`; }
    else msg = `Bra längd. ${L.px - px} px kvar.`;

    meter.className = "tm-meter" + (cls === "bad" ? " bad" : cls === "warn" ? " warn" : "");
    status.className = "tm-status " + cls;
    status.textContent = msg;
    return { text, px, chars };
  }

  function cutAt(text, size, limit) {
    let lo = 0, hi = text.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (width(text.slice(0, mid) + "…", size) <= limit) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  // ---------- Förhandsvisning ----------

  function parsePage() {
    let raw = f.page.value.trim() || f.url.value.trim();
    if (!raw) return null;
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    try { return new URL(raw); } catch { return null; }
  }

  function preview(t, d) {
    const u = parsePage();
    const host = u ? u.hostname.replace(/^www\./, "") : "dinsajt.se";
    const site = (original && original.siteName) || (host.split(".")[0] || "Din sajt").replace(/^./, (c) => c.toUpperCase());
    const parts = u ? u.pathname.split("/").filter(Boolean).map(decodeURIComponent) : [];
    $("serpSite").textContent = site;
    $("serpCrumb").textContent = (u ? u.origin : "https://dinsajt.se") + (parts.length ? " › " + parts.join(" › ") : "");
    $("serpFavLetter").textContent = site.charAt(0).toUpperCase();

    const titleEl = $("serpTitle");
    titleEl.classList.toggle("empty", !t.text);
    titleEl.textContent = t.text || "Din titel visas här";
    titleEl.href = u ? u.href : "#";

    // Google fetstilar orden i sökningen, här sökordets ord
    let html = d.text ? esc(d.text) : '<span class="empty">Din meta description visas här. Saknas den väljer Google en egen text från sidan.</span>';
    if (d.text) for (const w of kwWords()) html = html.replace(new RegExp(wordRe(esc(w)).source, "giu"), "$1<b>$2</b>");
    $("serpDesc").innerHTML = html;
  }

  function setFavicon(src) {
    const img = $("serpFavImg");
    const letter = $("serpFavLetter");
    if (!src) { img.hidden = true; letter.hidden = false; return; }
    img.onload = () => { img.hidden = false; letter.hidden = true; };
    img.onerror = () => { img.hidden = true; letter.hidden = false; };
    img.src = src;
  }

  // ---------- Kontroller ----------

  function checks(t, d) {
    const kw = norm(f.kw.value);
    const tl = norm(t.text), dl = norm(d.text);
    const out = [];
    const add = (state, label, note = "") => out.push({ state, label, note });

    if (!t.text) add("no", "Titel saknas", "Utan title hittar Google på en egen, oftast sidans rubrik.");
    else add(t.px <= LIMITS.title.px && t.chars >= LIMITS.title.min ? "ok" : t.px > LIMITS.title.px ? "no" : "part", "Titeln har rätt längd", `${t.chars} tecken, ${t.px} px. Sikta på ${LIMITS.title.min}–${LIMITS.title.max} tecken och under ${LIMITS.title.px} px.`);

    if (!d.text) add("no", "Meta description saknas", "Google väljer då en textbit från sidan, som sällan säljer lika bra.");
    else add(d.px <= LIMITS.desc.px && d.chars >= LIMITS.desc.min ? "ok" : d.px > LIMITS.desc.px ? "no" : "part", "Beskrivningen har rätt längd", `${d.chars} tecken, ${d.px} px. Sikta på ${LIMITS.desc.min}–${LIMITS.desc.max} tecken.`);

    if (!kw) {
      add("na", "Sökordet i titeln", "Fyll i ett sökord ovan för att kolla.");
      add("na", "Sökordet i beskrivningen");
    } else {
      const words = kwWords();
      const inTitle = tl.includes(kw);
      const allInTitle = words.every((w) => wordRe(w).test(tl));
      add(inTitle ? "ok" : allInTitle ? "part" : "no", "Sökordet står i titeln", inTitle ? "" : allInTitle ? "Orden finns men inte i följd. Ofta okej, men exakt fras är tydligast." : `"${f.kw.value.trim()}" finns inte i titeln.`);
      if (inTitle) {
        const pos = tl.indexOf(kw);
        add(pos <= Math.max(10, tl.length * 0.35) ? "ok" : "part", "Sökordet står tidigt i titeln", pos <= Math.max(10, tl.length * 0.35) ? "" : "Flytta det närmare början. Det som står först läses.");
      }
      const allInDesc = words.every((w) => wordRe(w).test(dl));
      add(dl.includes(kw) ? "ok" : allInDesc ? "part" : "no", "Sökordet står i beskrivningen", dl.includes(kw) || allInDesc ? "Google fetstilar det, se förhandsvisningen." : "Orden som matchar sökningen blir fetstilade och syns mer.");
      const count = (tl.match(new RegExp(wordRe(kw).source, "giu")) || []).length;
      if (count > 1) add("part", "Sökordet upprepas i titeln", "En gång räcker. Upprepning ser ut som sökordsfyllnad.");
    }

    if (t.text && d.text) add(tl !== dl ? "ok" : "no", "Titel och beskrivning skiljer sig", tl === dl ? "Samma text två gånger slösar bort platsen." : "");

    if (t.text) {
      const letters = t.text.replace(/[^\p{L}]/gu, "");
      const caps = letters.replace(/[^\p{Lu}]/gu, "").length;
      if (letters.length > 8 && caps / letters.length > 0.5) add("no", "Titeln är skriven med versaler", "Versaler tar mer plats och läses som att någon skriker.");
      const seen = new Map();
      for (const w of tl.split(/[^\p{L}\p{N}]+/u).filter((x) => x.length > 3)) seen.set(w, (seen.get(w) || 0) + 1);
      const dup = [...seen].filter(([w, n]) => n > 1 && !(kw && kw.includes(w))).map(([w]) => w);
      if (dup.length) add("part", "Ord upprepas i titeln", `"${dup.join('", "')}" står flera gånger.`);
      if (/[!]{2,}|[?]{2,}/.test(t.text)) add("part", "Flera utropstecken eller frågetecken", "Ser ut som reklam och kan få Google att skriva om titeln.");
      const sep = /\s[|–—-]\s|:\s/.test(t.text);
      add(sep ? "ok" : "part", "Varumärket står avskilt i titeln", sep ? "" : "Lägg gärna varumärket sist, efter | eller kolon, om det får plats.");
    }

    if (d.text) {
      if (/"/.test(d.text)) add("part", "Citattecken i beskrivningen", "Raka citattecken måste skrivas som &quot; i HTML. Koden nedan gör det åt dig.");
      add(/[.!?]$/.test(d.text) ? "ok" : "part", "Beskrivningen slutar som en mening", /[.!?]$/.test(d.text) ? "" : "Avsluta med punkt, gärna efter en uppmaning som ”Boka i dag.”");
    }

    const ok = out.filter((c) => c.state === "ok").length;
    const rated = out.filter((c) => c.state !== "na").length;
    $("score").textContent = rated ? `${ok} av ${rated} klara` : "";
    $("checks").innerHTML = out.map((c) => `<li class="${c.state}"><span>${esc(c.label)}${c.note ? `<small>${esc(c.note)}</small>` : ""}</span></li>`).join("");
  }

  // ---------- Kod ----------

  function code(t, d) {
    const lines = [];
    lines.push(`<title>${esc(t.text || "Din titel")}</title>`);
    lines.push(`<meta name="description" content="${esc(d.text || "Din beskrivning")}">`);
    $("code").textContent = lines.join("\n");
  }

  // ---------- Allt på en gång ----------

  function update() {
    const t = measure("title");
    const d = measure("desc");
    preview(t, d);
    checks(t, d);
    code(t, d);
  }

  // ---------- Hämtning ----------

  function showNow(data) {
    const rows = [
      ["Title", data.title ? `${data.title} (${data.title.length} tecken)` : "saknas"],
      ["Description", data.description ? `${data.description} (${data.description.length} tecken)` : "saknas"],
      ["H1", data.h1 || "saknas"],
    ];
    $("nowList").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
    const flags = [];
    if (!data.title) flags.push(["bad", "Sidan har ingen title."]);
    if (data.titleCount > 1) flags.push(["", `Sidan har ${data.titleCount} title-taggar. Bara den första räknas.`]);
    if (!data.description) flags.push(["", "Sidan har ingen meta description."]);
    if (data.descriptionCount > 1) flags.push(["", `Sidan har ${data.descriptionCount} meta description-taggar.`]);
    if (data.robots && /noindex/i.test(data.robots)) flags.push(["bad", "Sidan har noindex och visas inte alls i sökresultatet."]);
    if (data.canonical && data.canonical.replace(/\/$/, "") !== data.url.replace(/\/$/, "")) flags.push(["", `Canonical pekar på en annan adress: ${data.canonical}`]);
    if (data.url !== original?.requested) flags.push(["", `Skickades vidare till ${data.url}`]);
    $("nowFlags").innerHTML = flags.map(([c, t]) => `<li class="${c}">${esc(t)}</li>`).join("");
    $("nowBox").hidden = false;
  }

  function fill(data) {
    f.title.value = data.title || "";
    f.desc.value = data.description || "";
    f.page.value = data.url;
    setFavicon(data.favicon);
    update();
  }

  $("fetchForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = f.url.value.trim();
    const err = $("fetchError");
    const btn = $("fetchBtn");
    err.textContent = "";
    if (!raw) { err.textContent = "Skriv in en webbadress först."; return; }
    btn.disabled = true;
    btn.textContent = "Hämtar…";
    try {
      const res = await fetch("/api/meta-fetch?url=" + encodeURIComponent(raw));
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || "Kunde inte hämta sidan.");
      original = { ...data, requested: /^https?:\/\//i.test(raw) ? raw : "https://" + raw };
      try { original.requested = new URL(original.requested).href; } catch {}
      showNow(data);
      fill(data);
      $("tmTitle").focus();
    } catch (x) {
      err.textContent = x.message || "Något gick fel, försök igen.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Hämta titel & meta";
    }
  });

  $("resetBtn").addEventListener("click", () => original && fill(original));

  // ---------- Övrigt ----------

  for (const el of [f.kw, f.title, f.desc, f.page]) el.addEventListener("input", update);
  f.url.addEventListener("input", () => { if (!f.page.value) update(); });
  // Radbrytningar hör inte hemma i en title
  for (const el of [f.title, f.desc]) el.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });

  document.querySelectorAll(".tm-tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      device = b.dataset.device;
      document.querySelectorAll(".tm-tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
      $("serp").className = "tm-serp " + device;
    })
  );

  async function copy(text, btn, done) {
    const label = btn.textContent;
    try { await navigator.clipboard.writeText(text); btn.textContent = done; }
    catch { btn.textContent = "Markera och kopiera själv"; }
    setTimeout(() => (btn.textContent = label), 1800);
  }
  $("copyCode").addEventListener("click", (e) => copy($("code").textContent, e.currentTarget, "Kopierat"));
  $("shareBtn").addEventListener("click", (e) => {
    const p = new URLSearchParams();
    if (f.page.value.trim()) p.set("u", f.page.value.trim());
    if (f.kw.value.trim()) p.set("k", f.kw.value.trim());
    if (f.title.value.trim()) p.set("t", f.title.value.trim());
    if (f.desc.value.trim()) p.set("d", f.desc.value.trim());
    copy(location.origin + location.pathname + (p.toString() ? "?" + p : ""), e.currentTarget, "Länken är kopierad");
  });

  // Förifyll från länken: ?u=&k=&t=&d= (delat utkast) eller ?url= (hämta direkt)
  const q = new URLSearchParams(location.search);
  if (q.get("u")) f.page.value = q.get("u");
  if (q.get("k")) f.kw.value = q.get("k");
  if (q.get("t")) f.title.value = q.get("t");
  if (q.get("d")) f.desc.value = q.get("d");
  update();
  if (q.get("url") && !q.get("t")) {
    f.url.value = q.get("url");
    $("fetchForm").requestSubmit();
  }
})();
