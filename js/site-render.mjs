/*
 * Website renderer — turns the site content (see js/site-default.mjs) into the
 * HTML regions of index.html. Used by:
 *   - tools/build.mjs            → the static index.html, llms.txt (fallback copy)
 *   - netlify/functions/site.mjs → the live home page, from what /admin saved
 *   - admin.html                 → the editor's live preview
 *
 * index.html marks each editable region with <!-- build:NAME --> … <!-- /build:NAME -->;
 * applyContent() swaps every region for freshly rendered HTML. Everything that
 * comes from content is escaped; links and media only allow safe URLs.
 */

export const SITE_URL = "https://krakhilesh.netlify.app/";
const MAX = { text: 400, long: 6000, list: 200 };
const OUTFITS = ["polo", "tee", "music", "polo-music", "phone", "vr"];
const RESERVED = ["main", "hero", "about", "featured", "work", "segments", "contact", "modal", "guide", "cursor"];

/* ---------------- Cleaning ---------------- */
const str = (v, max = MAX.text) => (typeof v === "string" ? v : v == null ? "" : String(v)).slice(0, max).trim();
const long = (v) => str(v, MAX.long);
const arr = (v) => (Array.isArray(v) ? v.slice(0, MAX.list) : []);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const lines = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : []).map((l) => str(l, 1200)).filter(Boolean).slice(0, MAX.list);
const list = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []).map((t) => str(t, 120)).filter(Boolean).slice(0, 40);
const color = (v, d) => (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(str(v)) ? str(v) : d);

export function slugify(s) {
  return str(s).toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}
function unique(base, taken) {
  let s = base || "item", n = 2;
  while (taken.has(s)) s = `${base}-${n++}`;
  taken.add(s);
  return s;
}

// Links: https, http, mailto, in-page anchors and site paths
export function safeHref(u) {
  u = str(u, 2000);
  return /^(https?:\/\/|mailto:|#|\/(?!\/))/i.test(u) ? u : "";
}
// Images and video files: https or this site's own /media/ and /assets/
export function safeSrc(u) {
  u = str(u, 2000);
  return /^(https:\/\/|\/(media|assets)\/)/i.test(u) ? u : "";
}

// YouTube link or id → { id, short } (or null)
export function parseVideo(v) {
  if (v && typeof v === "object") v = v.short ? `https://www.youtube.com/shorts/${v.id}` : v.id;
  const s = str(v, 500);
  if (!s) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return { id: s, short: false };
  const m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/);
  return m ? { id: m[1], short: /\/shorts\//.test(s) } : null;
}
export const videoUrl = (v) => (v ? (v.short ? "https://www.youtube.com/shorts/" : "https://www.youtube.com/watch?v=") + v.id : "");
const isVideoFile = (u) => /\.(mp4|webm)(\?|$)/i.test(u) || /^\/media\/.+\.(mp4|webm)$/i.test(u);

function cleanSection(s, taken) {
  const type = ["research", "experience", "resume"].includes(s.type) ? s.type : "custom";
  const base = { type, hidden: !!s.hidden, title: str(s.title), subtitle: str(s.subtitle), say: str(s.say, 600) };
  if (type === "research") {
    const row = (r) => ({ tag: str(r.tag), highlight: !!r.highlight, title: str(r.title, 600), sub: str(r.sub), url: safeHref(r.url) });
    return Object.assign(base, {
      id: unique("research", taken),
      counters: arr(s.counters).map(obj).map((c) => ({ value: str(c.value, 20), label: str(c.label) })).filter((c) => c.value || c.label).slice(0, 8),
      patentsTitle: str(s.patentsTitle), patents: arr(s.patents).map(obj).map(row).filter((r) => r.title),
      papersTitle: str(s.papersTitle), papers: arr(s.papers).map(obj).map(row).filter((r) => r.title),
      note: long(s.note)
    });
  }
  if (type === "experience") {
    return Object.assign(base, {
      id: unique("experience", taken),
      jobs: arr(s.jobs).map(obj).map((j) => ({ when: str(j.when), title: str(j.title), text: str(j.text, 1200) })).filter((j) => j.title),
      chips: list(s.chips)
    });
  }
  if (type === "resume") {
    return Object.assign(base, { id: unique("resume", taken), lead: str(s.lead, 600), points: lines(s.points), button: str(s.button) });
  }
  return Object.assign(base, {
    id: unique(slugify(s.id) || slugify(s.title) || "section", taken),
    blocks: arr(s.blocks).map(obj).map((b) => {
      const kind = ["text", "image", "video"].includes(b.type) ? b.type : "text";
      return { type: kind, width: b.width === "half" ? "half" : "full", text: long(b.text), src: safeSrc(b.src), alt: str(b.alt), caption: str(b.caption, 600), video: str(typeof b.video === "object" ? videoUrl(b.video) : b.video, 600) };
    }).filter((b) => (b.type === "text" ? b.text : b.type === "image" ? b.src : (parseVideo(b.video) || safeSrc(b.video))))
  });
}

export function sanitizeSite(input) {
  const d = obj(input), m = obj(d.meta), h = obj(d.header), hero = obj(d.hero), c = obj(d.contact);
  const segKeys = new Set();
  const segments = arr(d.segments).map(obj).filter((s) => str(s.title)).map((s) => ({
    key: unique(slugify(s.key) || slugify(s.title), segKeys), title: str(s.title), blurb: str(s.blurb, 600), say: str(s.say, 600)
  }));
  const slugs = new Set(RESERVED);
  const projects = arr(d.projects).map(obj).filter((p) => str(p.title)).map((p) => {
    const f = p.featured && typeof p.featured === "object" ? p.featured : null;
    return {
      slug: unique(slugify(p.slug) || slugify(p.title), slugs),
      segment: segKeys.has(str(p.segment)) ? str(p.segment) : (segments[0] ? segments[0].key : ""),
      title: str(p.title), label: str(p.label), summary: str(p.summary, 1200),
      tags: list(p.tags), video: parseVideo(p.video), image: safeSrc(p.image), signal: str(p.signal),
      details: lines(p.details),
      links: arr(p.links).map(obj).map((l) => ({ label: str(l.label), url: safeHref(l.url) })).filter((l) => l.label && l.url),
      featured: f ? {
        color: color(f.color, "#2b5be6"), ink: color(f.ink, "#ffffff"), file: str(f.file) || slugify(p.title) + ".mp4",
        outfit: OUTFITS.includes(f.outfit) ? f.outfit : "polo", say: [str(lines(f.say)[0], 600), str(lines(f.say)[1], 600)]
      } : null
    };
  });
  const taken = new Set(RESERVED.concat(segments.map((s) => "seg-" + s.key)));
  return {
    meta: { title: str(m.title, 200), description: str(m.description, 400), shareTitle: str(m.shareTitle, 200), shareDescription: str(m.shareDescription, 400) },
    header: { name: str(h.name), tagline: str(h.tagline), cta: str(h.cta) },
    hero: { line1: str(hero.line1), line2: str(hero.line2), say: str(hero.say, 600) },
    about: { text: long(obj(d.about).text) },
    tour: { button: str(obj(d.tour).button) },
    work: { title: str(obj(d.work).title) },
    segments, projects,
    sections: arr(d.sections).map(obj).map((s) => cleanSection(s, taken)),
    contact: {
      title: str(c.title), lead: str(c.lead, 600), email: str(c.email, 200).replace(/[^\w.+@-]/g, ""),
      links: arr(c.links).map(obj).map((l) => ({ label: str(l.label), url: safeHref(l.url) })).filter((l) => l.label && l.url),
      location: str(c.location)
    }
  };
}

/* ---------------- HTML helpers ---------------- */
export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}
const yt = (id, file) => `https://i.ytimg.com/vi/${id}/${file}.jpg`;
const pad = (n) => String(n).padStart(2, "0");
const ext = (u) => /^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : "";

// "*bold*" and "[label](url)" inside escaped text
export function inline(text) {
  return esc(text)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, label, url) => {
      const href = safeHref(url.replace(/&amp;/g, "&"));
      return href ? `<a href="${esc(href)}"${ext(href)}>${label}</a>` : label;
    })
    .replace(/\*([^*]+)\*/g, "<b>$1</b>");
}
const paragraphs = (text) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${inline(p).replace(/\n/g, "<br>")}</p>`).join("");

/* ---------------- Regions ---------------- */
function head(c) {
  const m = c.meta;
  return `<title>${esc(m.title)}</title>
<meta name="description" content="${esc(m.description)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<meta name="author" content="${esc(c.header.name)}">
<meta name="google-site-verification" content="Kpr4dLHn9mqhXbdpvgq5EYQrcOpgdQzPs35KMfipUvw">
<link rel="canonical" href="${SITE_URL}">
<meta name="theme-color" content="#2b5be6">

<meta property="og:type" content="profile">
<meta property="og:site_name" content="${esc(c.header.name)}">
<meta property="og:locale" content="en_IN">
<meta property="profile:first_name" content="Akhilesh">
<meta property="profile:last_name" content="Bhagat">
<meta property="og:url" content="${SITE_URL}">
<meta property="og:title" content="${esc(m.shareTitle || m.title)}">
<meta property="og:description" content="${esc(m.shareDescription || m.description)}">
<meta property="og:image:alt" content="${esc(c.header.name)} — ${esc(c.hero.line1)} ${esc(c.hero.line2)}">
<meta property="og:image" content="${SITE_URL}assets/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(m.shareTitle || m.title)}">
<meta name="twitter:description" content="${esc(m.shareDescription || m.description)}">
<meta name="twitter:image" content="${SITE_URL}assets/og.jpg">`;
}

function header(c) {
  return `<header class="top">
  <a class="top__name" href="#main">
    <b>${esc(c.header.name)}</b>
    <span>${esc(c.header.tagline)}</span>
  </a>
</header>
<a class="pill magnetic top__cta" href="#contact">${esc(c.header.cta || "Get in touch")} <span aria-hidden="true">↓</span></a>`;
}

function hero(c) {
  return `  <section class="hero" id="hero" data-say="${esc(c.hero.say)}">
    <div class="wrap hero__copy">
      <h1 class="hero__title" data-split>
        <span class="sr-only">${esc(c.header.name)}, ${esc(c.header.tagline.toLowerCase())} — </span>
        <span class="hero__l1">${esc(c.hero.line1)}</span>
        <span class="hero__l2">${esc(c.hero.line2)}</span>
      </h1>
    </div>
    <div class="hero__stage">
      <p class="bubble bubble--hero" id="heroBubble" aria-live="polite"><span class="bubble__tail"></span><span class="bubble__txt"></span></p>
    </div>
  </section>`;
}

function about(c) {
  return `  <section class="about" id="about" aria-label="About">
    <div class="about__pin">
      <div class="wrap">
        <p class="about__text" id="aboutText">${esc(c.about.text)}</p>
      </div>
    </div>
  </section>`;
}

function tour(c) {
  const any = c.projects.some((p) => p.featured && (p.video || p.image));
  return `  <section class="tour" id="featured" aria-label="Featured projects"${any ? "" : " hidden"}>
    <div class="tour__stage" id="tourStage">
      <div class="wrap tour__inner">
        <div class="tour__bars" id="tourBars" aria-hidden="true"></div>
        <header class="tour__head">
          <div class="tour__titles" id="tourTitles"></div>
          <button class="pill magnetic" type="button" id="tourPill">${esc(c.tour.button || "Watch the film")} <span aria-hidden="true">→</span></button>
        </header>
        <div class="tour__screens" id="tourScreens"></div>
      </div>
      <p class="bubble bubble--tour" id="tourBubble"><span class="bubble__tail"></span><span class="bubble__txt"></span></p>
    </div>
  </section>`;
}

function tileMedia(p) {
  const alt = esc(`${p.title} — ${p.video ? "demo video" : "photo"}`);
  if (p.image) return `<span class="tile__media"><img src="${esc(p.image)}" alt="${alt}" width="480" height="300" loading="lazy" decoding="async"></span>`;
  if (!p.video) return `<span class="tile__media tile__media--blank"><span>${esc(p.signal || p.tags.join(" · ") || p.title)}</span></span>`;
  if (p.video.short) return `<span class="tile__media tile__media--short" style="--img:url('${yt(p.video.id, "hqdefault")}')" role="img" aria-label="${alt}"><span class="tile__poster"></span><span class="tile__chip">Short</span></span>`;
  return `<span class="tile__media" data-flip="${esc(p.video.id)}"><img src="${yt(p.video.id, "hqdefault")}" class="is-lb" data-poster="${esc(p.video.id)}" alt="${alt}" width="480" height="360" loading="lazy" decoding="async"></span>`;
}

function tile(p, i) {
  const links = [];
  if (p.video) links.push(`<a href="${videoUrl(p.video)}" target="_blank" rel="noopener">Watch the demo</a>`);
  p.links.forEach((l) => links.push(`<a href="${esc(l.url)}"${ext(l.url)}>${esc(l.label)}</a>`));
  const tags = esc(p.tags.join(" · "));
  return `
          <article class="tile reveal" id="${esc(p.slug)}" style="--d:${(i % 3) * 110}ms" data-project="${esc(p.slug)}" data-cursor="${p.video ? "Play" : "Open"}">
            ${tileMedia(p)}
            <div class="tile__cap"><h4 class="tile__title"><button type="button">${esc(p.title)}</button></h4><span class="tile__label">${esc(p.label)}</span></div>
            <p class="tile__sum">${esc(p.summary)}</p>
            <p class="tile__more">${tags}${tags && links.length ? " — " : ""}${links.join(" · ")}</p>
          </article>`;
}

function work(c) {
  const groups = c.segments.map((s) => ({ s, items: c.projects.filter((p) => p.segment === s.key) })).filter((g) => g.items.length);
  const count = groups.reduce((n, g) => n + g.items.length, 0);
  const nav = groups.map(({ s, items }) => `<a href="#seg-${esc(s.key)}" data-seg="${esc(s.key)}">${esc(s.title)}<sup>${items.length}</sup></a>`).join("\n        ");
  const segs = groups.map(({ s, items }, si) => `
      <section class="seg" id="seg-${esc(s.key)}" data-say="${esc(s.say)}" data-outfit="${si % 2 ? "polo" : "tee"}" aria-labelledby="seg-${esc(s.key)}-title">
        <header class="seg__head reveal"><span class="seg__no">${pad(si + 1)}</span><h3 id="seg-${esc(s.key)}-title" data-split>${esc(s.title)}</h3><p>${esc(s.blurb)}</p></header>
        <div class="tiles">${items.map(tile).join("")}
        </div>
      </section>`).join("");
  return `  <section class="work" id="work"${count ? "" : " hidden"}>
    <div class="wrap">
      <header class="work__head reveal">
        <h2 data-split>${esc(c.work.title || "All work")}</h2>
        <p id="workCount">${count} project${count === 1 ? "" : "s"} in ${groups.length} group${groups.length === 1 ? "" : "s"}</p>
      </header>
      <nav class="segnav" id="segNav" aria-label="Project groups">
        ${nav}
      </nav>
      <div id="segments">${segs}
      </div>
    </div>
  </section>`;
}

const sectionHead = (s) => `      <header class="work__head reveal">
        <h2 data-split>${esc(s.title)}</h2>${s.subtitle ? `
        <p>${esc(s.subtitle)}</p>` : ""}
      </header>`;
const sayAttr = (s) => (s.say ? ` data-say="${esc(s.say)}"` : "");

function counter(cn) {
  const m = cn.value.match(/^(\d{1,7})(\D{0,3})$/);
  const b = m ? `<b data-count="${m[1]}"${m[2] ? ` data-suffix="${esc(m[2])}"` : ""}>${esc(cn.value)}</b>` : `<b>${esc(cn.value)}</b>`;
  return `        <li>${b}<span>${esc(cn.label)}</span></li>`;
}

function row(r) {
  const tag = `<span class="row__tag${r.highlight ? " is-hot" : ""}">${esc(r.tag)}</span>`;
  const sub = (indent) => (r.sub ? `\n${indent}<span class="row__sub">${esc(r.sub)}</span>` : "");
  if (r.url) return `            <li class="row reveal">
              <a class="row__link" href="${esc(r.url)}"${ext(r.url)}>
                ${tag}
                <span class="row__title">${esc(r.title)}</span>
                <span class="row__go" aria-hidden="true">↗</span>${sub("                ")}
              </a>
            </li>`;
  return `            <li class="row reveal">
              ${tag}
              <span class="row__title">${esc(r.title)}</span>${sub("              ")}
            </li>`;
}
const rows = (title, items) => items.length ? `        <div>${title ? `
          <h3 class="minihead reveal">${esc(title)}</h3>` : ""}
          <ol class="rows">
${items.map(row).join("\n")}
          </ol>` : "";

function research(s) {
  const cols = [rows(s.patentsTitle, s.patents), rows(s.papersTitle, s.papers)].filter(Boolean);
  if (cols.length) cols[cols.length - 1] += s.note ? `\n          <p class="note reveal">${inline(s.note)}</p>` : "";
  return `  <section class="proof" id="${s.id}"${sayAttr(s)}>
    <div class="wrap">
${sectionHead(s)}${s.counters.length ? `

      <ul class="counters reveal">
${s.counters.map(counter).join("\n")}
      </ul>` : ""}${cols.length ? `

      <div class="cols">
${cols.map((col) => col + "\n        </div>").join("\n")}
      </div>` : s.note ? `\n      <p class="note reveal">${inline(s.note)}</p>` : ""}
    </div>
  </section>`;
}

function experience(s) {
  return `  <section class="proof" id="${s.id}"${sayAttr(s)}>
    <div class="wrap">
${sectionHead(s)}${s.jobs.length ? `
      <ol class="jobs">
${s.jobs.map((j) => `        <li class="job reveal"><span class="job__when">${esc(j.when)}</span><span class="job__what"><b>${esc(j.title)}</b> ${esc(j.text)}</span></li>`).join("\n")}
      </ol>` : ""}${s.chips.length ? `
      <ul class="chips reveal" aria-label="Toolkit">
        ${s.chips.map((t) => `<li>${esc(t)}</li>`).join("")}
      </ul>` : ""}
    </div>
  </section>`;
}

function resume(s) {
  return `  <section class="proof" id="${s.id}"${sayAttr(s)}>
    <div class="wrap">
${sectionHead(s)}
      <div class="resume">
        <a class="resume__paper reveal" href="/resume" aria-label="Open my résumé">
          <span class="resume__frame"><iframe src="/resume?embed=1" title="Résumé preview" loading="lazy" scrolling="no" tabindex="-1" aria-hidden="true"></iframe></span>
        </a>
        <div class="resume__side reveal">${s.lead ? `
          <p class="resume__lead">${esc(s.lead)}</p>` : ""}${s.points.length ? `
          <ul class="resume__list">
${s.points.map((p) => `            <li>${inline(p)}</li>`).join("\n")}
          </ul>` : ""}
          <div class="resume__cta">
            <a class="pill pill--blue" href="/resume">${esc(s.button || "Open my résumé")} <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

function block(b, title) {
  const cls = `block block--${b.type}${b.width === "half" ? " block--half" : ""} reveal`;
  const cap = b.caption ? `<figcaption>${inline(b.caption)}</figcaption>` : "";
  if (b.type === "text") return `        <div class="${cls}">${paragraphs(b.text)}</div>`;
  if (b.type === "image") return `        <figure class="${cls}"><img src="${esc(b.src)}" alt="${esc(b.alt || b.caption)}" loading="lazy" decoding="async">${cap}</figure>`;
  const v = parseVideo(b.video);
  if (v) return `        <figure class="${cls}"><div class="frame${v.short ? " frame--short" : ""}"><iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0&amp;modestbranding=1&amp;playsinline=1" title="${esc(b.caption || title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>${cap}</figure>`;
  const src = safeSrc(b.video);
  return src && isVideoFile(src) ? `        <figure class="${cls}"><video src="${esc(src)}" controls playsinline preload="metadata"></video>${cap}</figure>` : "";
}

function custom(s) {
  return `  <section class="proof custom" id="${esc(s.id)}"${sayAttr(s)}>
    <div class="wrap">
${s.title || s.subtitle ? sectionHead(s) : ""}
      <div class="blocks">
${s.blocks.map((b) => block(b, s.title)).filter(Boolean).join("\n")}
      </div>
    </div>
  </section>`;
}

function sections(c) {
  const draw = { research, experience, resume, custom };
  return c.sections.filter((s) => !s.hidden).map((s) => draw[s.type](s)).join("\n\n");
}

function contact(c) {
  const k = c.contact, at = k.email.indexOf("@");
  const mail = k.email ? `\n    <a class="end__mail reveal" href="mailto:${esc(k.email)}">${at > 0 ? esc(k.email.slice(0, at)) + "<wbr>" + esc(k.email.slice(at)) : esc(k.email)}</a>\n` : "";
  return `    <h2 class="end__title reveal split" data-split>${esc(k.title)}</h2>
    <p class="end__lead reveal">${esc(k.lead)}</p>${mail}
    <ul class="end__links reveal">
${k.links.map((l) => `      <li><a href="${esc(l.url)}"${ext(l.url)}>${esc(l.label)} <span>${/^https?:/i.test(l.url) ? "↗" : "→"}</span></a></li>`).join("\n")}
    </ul>`;
}

function copy(c) {
  return `    <p class="end__copy">© <span id="year">${new Date().getFullYear()}</span> ${esc(c.header.name)}${c.contact.location ? " · " + esc(c.contact.location) : ""} · <button class="dress" id="dressUp" type="button">Dress me up</button> · <button class="dress" id="motionToggle" type="button">Motion</button></p>`;
}

// Characters that must not appear raw inside an inline <script>
const UNSAFE_JSON = new RegExp("[<" + String.fromCharCode(0x2028, 0x2029) + "]", "g");

// What main.js needs for the tour, the pop-up player and the mascot's comments
function data(c) {
  const json = JSON.stringify({ segments: c.segments, projects: c.projects }).replace(UNSAFE_JSON, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
  return `<script>window.SITE = ${json};</script>`;
}

/* ---------------- Structured data ---------------- */
export function jsonLd(c, today = new Date().toISOString().slice(0, 10)) {
  const papers = c.sections.filter((s) => s.type === "research" && !s.hidden).flatMap((s) => s.papers);
  const person = {
    "@type": "Person",
    "@id": SITE_URL + "#person",
    name: c.header.name,
    alternateName: ["Akhilesh kr Bhagat", "Akhilesh Bhagat", "krakhilesh"],
    url: SITE_URL,
    image: SITE_URL + "assets/og.jpg",
    email: c.contact.email ? "mailto:" + c.contact.email : undefined,
    jobTitle: "Embedded Systems Engineer · Student Research Assistant, National Quantum Mission, IIT Kanpur",
    description: c.about.text.replace(/\*/g, ""),
    address: { "@type": "PostalAddress", addressRegion: "West Bengal", addressCountry: "IN" },
    affiliation: [
      { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Madras", sameAs: "https://www.iitm.ac.in/" },
      { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Kanpur", sameAs: "https://www.iitk.ac.in/" },
      { "@type": "Organization", name: "National Quantum Mission (India)" }
    ],
    worksFor: { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Kanpur" },
    alumniOf: { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Madras" },
    knowsAbout: ["Embedded systems", "Firmware", "ESP32", "STM32", "FreeRTOS", "Linux device drivers", "Raspberry Pi", "IoT", "MQTT", "ESP-NOW", "Robotics", "ROS 2", "Computer vision", "OpenCV", "Human–computer interaction", "Assistive technology", "New interfaces for musical expression", "Hardware prototyping"],
    sameAs: c.contact.links.map((l) => l.url).filter((u) => /^https:/.test(u))
  };
  const graph = [
    { "@type": "WebSite", "@id": SITE_URL + "#website", url: SITE_URL, name: c.header.name + " — Portfolio", inLanguage: "en", publisher: { "@id": SITE_URL + "#person" } },
    { "@type": "ProfilePage", "@id": SITE_URL + "#profile", url: SITE_URL, name: c.meta.shareTitle || c.meta.title, isPartOf: { "@id": SITE_URL + "#website" }, mainEntity: { "@id": SITE_URL + "#person" }, dateModified: today },
    person,
    {
      "@type": "ItemList",
      name: "Projects by " + c.header.name,
      itemListElement: c.projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: Object.assign({
          "@type": "CreativeWork",
          name: p.title,
          url: SITE_URL + "#" + p.slug,
          description: [p.summary].concat(p.details).join(" "),
          keywords: p.tags.join(", "),
          genre: (c.segments.find((s) => s.key === p.segment) || {}).title,
          creator: { "@id": SITE_URL + "#person" }
        }, p.image ? { image: new URL(p.image, SITE_URL).href } : {}, p.video ? {
          video: { "@type": "VideoObject", name: p.title + " — demo", description: p.summary, thumbnailUrl: yt(p.video.id, "hqdefault"), embedUrl: "https://www.youtube.com/embed/" + p.video.id, contentUrl: videoUrl(p.video) }
        } : {})
      }))
    }
  ].concat(papers.map((p) => Object.assign({ "@type": "ScholarlyArticle", headline: p.title, name: p.title, isPartOf: { "@type": "PublicationEvent", name: p.tag }, author: { "@id": SITE_URL + "#person" } }, p.url ? { url: p.url } : {})));
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

/* ---------------- Putting it together ---------------- */
export function renderRegions(content, opts = {}) {
  const c = sanitizeSite(content);
  return {
    head: head(c), jsonld: jsonLd(c, opts.today), header: header(c), hero: hero(c), about: about(c), tour: tour(c),
    work: work(c), sections: sections(c), contact: contact(c), copy: copy(c), data: data(c)
  };
}
export const REGIONS = ["head", "jsonld", "header", "hero", "about", "tour", "work", "sections", "contact", "copy", "data"];

// Replace every <!-- build:NAME --> … <!-- /build:NAME --> region. Missing markers are skipped
// (or reported, with { strict: true }).
export function applyContent(html, content, opts = {}) {
  const regions = renderRegions(content, opts);
  for (const name of REGIONS) {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(html)) { if (opts.strict) throw new Error("marker build:" + name + " not found"); continue; }
    html = html.replace(re, (all, open, close) => `${open}\n${regions[name]}\n${close}`);
  }
  return html;
}

/* ---------------- llms.txt (plain-text profile for AI assistants) ---------------- */
export function renderLlms(content) {
  const c = sanitizeSite(content), out = [];
  const plain = (t) => t.replace(/\*/g, "").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  out.push("# " + c.header.name, "", "> " + plain(c.about.text), "");
  out.push("- Website: " + SITE_URL);
  if (c.contact.email) out.push("- Email: " + c.contact.email);
  c.contact.links.forEach((l) => out.push(`- ${l.label}: ${new URL(l.url, SITE_URL).href}`));
  if (c.contact.location) out.push("- Location: " + c.contact.location);
  if (c.contact.lead) out.push("- " + c.contact.lead);
  for (const s of c.sections.filter((x) => !x.hidden)) {
    if (s.type === "experience") {
      out.push("", "## " + (s.title || "Experience"), "");
      s.jobs.forEach((j) => out.push(`- ${j.title} — ${j.text}${j.when ? ` (${j.when})` : ""}`));
      if (s.chips.length) out.push("", "Skills: " + s.chips.join(", "));
    }
    if (s.type === "research") {
      if (s.patents.length) { out.push("", "## " + (s.patentsTitle || "Patents"), ""); s.patents.forEach((p) => out.push(`- ${p.tag ? p.tag + " — " : ""}${p.title}${p.sub ? ` (${p.sub})` : ""}`)); }
      if (s.papers.length) { out.push("", "## " + (s.papersTitle || "Publications"), ""); s.papers.forEach((p) => out.push(`- ${p.title}${p.tag ? `. ${p.tag}` : ""}${p.url ? ". " + p.url : ""}`)); }
      if (s.note) out.push("- " + plain(s.note));
    }
    if (s.type === "custom" && s.title) {
      out.push("", "## " + s.title, "");
      if (s.subtitle) out.push(s.subtitle, "");
      s.blocks.filter((b) => b.type === "text").forEach((b) => out.push(plain(b.text), ""));
    }
  }
  out.push("", "## Projects", "");
  c.segments.forEach((s) => {
    const items = c.projects.filter((p) => p.segment === s.key);
    if (!items.length) return;
    out.push("### " + s.title, "");
    items.forEach((p) => {
      out.push(`- **${p.title}**${p.label ? ` (${p.label})` : ""} — ${p.summary}`);
      p.details.forEach((d) => out.push("  - " + d));
      if (p.tags.length) out.push("  - Tech: " + p.tags.join(", "));
      if (p.video) out.push("  - Video: " + videoUrl(p.video));
      p.links.forEach((l) => out.push(`  - ${l.label}: ${new URL(l.url, SITE_URL).href}`));
    });
    out.push("");
  });
  out.push("Résumé: " + SITE_URL + "resume");
  return out.join("\n") + "\n";
}
