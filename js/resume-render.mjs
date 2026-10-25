/*
 * Résumé renderer — shared by the Netlify function that serves /resume and by
 * the /admin editor's live preview, so both always look the same.
 *
 *   sanitizeResume(anything) → a clean résumé object (unknown keys dropped,
 *                              strings trimmed and length-capped)
 *   renderResumePage(resume, { embed }) → a complete HTML page
 *
 * Every string is HTML-escaped on the way out; links only allow https://,
 * http:// and mailto:.
 */

const SITE = "https://krakhilesh.netlify.app/";
const MAX = { text: 600, long: 4000, list: 80 };

const str = (v, max = MAX.text) => (typeof v === "string" ? v : v == null ? "" : String(v)).slice(0, max).trim();
const arr = (v) => (Array.isArray(v) ? v.slice(0, MAX.list) : []);
const obj = (v) => (v && typeof v === "object" ? v : {});
const lines = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split("\n") : []).map((l) => str(l)).filter(Boolean).slice(0, MAX.list);

export function sanitizeResume(input) {
  const d = obj(input);
  return {
    name: str(d.name),
    headline: str(d.headline),
    role: str(d.role),
    contact: arr(d.contact).map(obj).map((c) => ({ text: str(c.text), url: str(c.url) })).filter((c) => c.text),
    summary: str(d.summary, MAX.long),
    skills: arr(d.skills).map(obj).map((s) => ({ label: str(s.label), value: str(s.value, MAX.long) })).filter((s) => s.label || s.value),
    education: arr(d.education).map(obj).map((e) => ({ title: str(e.title), detail: str(e.detail), when: str(e.when) })).filter((e) => e.title),
    experience: arr(d.experience).map(obj).map((e) => ({ title: str(e.title), org: str(e.org), when: str(e.when), bullets: lines(e.bullets) })).filter((e) => e.title),
    patents: arr(d.patents).map(obj).map((p) => ({ tag: str(p.tag), title: str(p.title), text: str(p.text), meta: str(p.meta) })).filter((p) => p.title || p.text),
    publications: arr(d.publications).map(obj).map((p) => ({ tag: str(p.tag), title: str(p.title), venue: str(p.venue) })).filter((p) => p.title),
    projectGroups: arr(d.projectGroups).map(obj).map((g) => ({
      title: str(g.title),
      items: arr(g.items).map(obj).map((i) => ({ name: str(i.name), tech: str(i.tech), text: str(i.text, MAX.long) })).filter((i) => i.name)
    })).filter((g) => g.title || g.items.length)
  };
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
const safeUrl = (u) => (/^(https?:\/\/|mailto:)/i.test(u) ? u : "");
const link = (text, url) => (safeUrl(url) ? `<a href="${esc(url)}">${esc(text)}</a>` : esc(text));
const section = (title, body) => (body ? `\n  <section>\n    <h2>${title}</h2>\n${body}\n  </section>` : "");
const tag = (t) => (t ? `<span class="tag">${esc(t)}</span>` : "");

export const RESUME_CSS = `
  :root {
    --blue: #2b5be6; --ink: #141414; --ink-2: #4d4d48; --ink-3: #85857e; --rule: #d9d9d2; --paper: #f1f1ec;
    --display: "Funnel Display", "Segoe UI", system-ui, sans-serif;
    --sans: "Funnel Sans", "Segoe UI", system-ui, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { background: var(--paper); color: var(--ink); font: 400 13px/1.42 var(--sans); -webkit-font-smoothing: antialiased; }
  a { color: inherit; text-decoration: none; }
  a:hover { color: var(--blue); }
  ul { list-style: none; }

  /* Screen: a sheet of paper with a small toolbar */
  .bar { position: sticky; top: 0; z-index: 2; display: flex; justify-content: space-between; align-items: center; gap: 12px; max-width: 860px; margin: 0 auto; padding: 14px 16px; background: var(--paper); }
  .bar a, .bar button { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 18px; border: 1.5px solid var(--ink); border-radius: 999px; background: #fff; font-weight: 500; }
  .bar button { font: inherit; color: #fff; cursor: pointer; background: var(--blue); border-color: var(--blue); }
  .bar a:hover, .bar button:hover { color: var(--ink); box-shadow: 3px 4px 0 var(--ink); }
  .bar button:hover { color: #fff; }
  .sheet { max-width: 860px; margin: 0 auto 48px; padding: 44px 52px 52px; background: #fff; border: 1.5px solid var(--ink); border-radius: 6px; }
  .embed { background: #fff; }
  .embed .sheet { margin: 0; border: 0; border-radius: 0; }

  /* Header */
  .head { display: grid; grid-template-columns: 1fr auto; gap: 6px 24px; align-items: end; padding-bottom: 12px; border-bottom: 2px solid var(--ink); }
  .head h1 { font: 700 30px/1 var(--display); letter-spacing: -0.03em; }
  .head .role { grid-column: 1 / -1; font-size: 13.5px; color: var(--ink-2); }
  .head .role b { color: var(--blue); font-weight: 600; }
  .contact { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, auto); justify-content: start; gap: 1px 26px; margin-top: 2px; font-size: 12px; color: var(--ink-2); }

  /* Sections */
  section { margin-top: 15px; }
  h2 { display: flex; align-items: center; gap: 10px; margin-bottom: 7px; font: 700 11.5px/1 var(--display); letter-spacing: .12em; text-transform: uppercase; color: var(--blue); }
  h2::after { content: ""; flex: 1; height: 1px; background: var(--rule); }
  .summary { color: var(--ink); white-space: pre-line; }

  .item { break-inside: avoid; }
  .item + .item { margin-top: 9px; }
  .item__top { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }
  .item__top h3 { font: 650 13.5px/1.25 var(--sans); }
  .item__top h3 span { font-weight: 400; color: var(--ink-2); }
  .when { flex: none; font-size: 12px; color: var(--ink-2); font-variant-numeric: tabular-nums; }
  .item ul { margin-top: 3px; }
  .item li, .list li { position: relative; padding-left: 13px; }
  .item li + li, .list li + li { margin-top: 2px; }
  .item li::before, .list li::before { content: ""; position: absolute; left: 2px; top: .62em; width: 4px; height: 4px; border-radius: 50%; background: var(--blue); }

  .list b { font-weight: 600; }
  .list .meta { color: var(--ink-2); }
  .tag { display: inline-block; margin-right: 4px; padding: 0 6px; border-radius: 4px; background: #e9eefc; color: var(--blue); font-size: 11px; font-weight: 600; line-height: 1.55; }

  .projects { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 26px; }
  .proj { break-inside: avoid; }
  .proj h3 { font: 650 13px/1.25 var(--sans); }
  .proj .tech { font-size: 11.5px; color: var(--blue); font-weight: 500; }
  .subhead { margin: 2px 0 6px; font-size: 11.5px; font-weight: 600; color: var(--ink-2); }
  .projects + .subhead { margin-top: 12px; }

  .skills { display: grid; grid-template-columns: 150px 1fr; gap: 3px 14px; }
  .skills dt { font-weight: 600; }

  @media (max-width: 700px) {
    .sheet { padding: 26px 18px 32px; border-radius: 0; border-inline: 0; }
    .head { grid-template-columns: 1fr; }
    .contact, .projects, .skills { grid-template-columns: 1fr; }
    .skills dd { margin-bottom: 6px; }
    .item__top { flex-direction: column; gap: 0; }
    .bar a, .bar button { padding: 0 14px; font-size: 14px; }
  }

  /* Print: two A4 pages, nothing but the résumé */
  @page { size: A4; margin: 11mm 12.5mm 10mm; }
  @media print {
    body { background: #fff; font-size: 9.1pt; line-height: 1.38; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bar { display: none; }
    .sheet { max-width: none; margin: 0; padding: 0; border: 0; border-radius: 0; }
    .head h1 { font-size: 22pt; }
    .head .role { font-size: 10pt; }
    .contact, .when { font-size: 8.6pt; }
    section { margin-top: 10.5pt; }
    h2 { font-size: 8.4pt; margin-bottom: 5pt; break-after: avoid; }
    .item__top h3 { font-size: 9.8pt; }
    .item + .item { margin-top: 6pt; }
    .proj h3 { font-size: 9.3pt; }
    .proj .tech, .subhead { font-size: 8.3pt; }
    .tag { font-size: 7.8pt; }
    .projects { gap: 5pt 18pt; }
    .skills { grid-template-columns: 112pt 1fr; gap: 2pt 10pt; }
  }
`;

// The home-page preview shows a fixed window onto the page, without scrollbars
const EMBED_CSS = "  html, body { overflow: hidden; }";

export function renderResumeBody(r) {
  const head = `  <header class="head">
    <h1>${esc(r.name)}</h1>
    <p class="role">${r.headline ? `<b>${esc(r.headline)}</b>${r.role ? " — " : ""}` : ""}${esc(r.role)}</p>
    <ul class="contact">
${r.contact.map((c) => `      <li>${link(c.text, c.url)}</li>`).join("\n")}
    </ul>
  </header>`;

  const summary = r.summary ? `    <p class="summary">${esc(r.summary)}</p>` : "";

  const skills = r.skills.length ? `    <dl class="skills">
${r.skills.map((s) => `      <dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd>`).join("\n")}
    </dl>` : "";

  const top = (title, sub, when) => `      <div class="item__top"><h3>${esc(title)}${sub ? ` <span>— ${esc(sub)}</span>` : ""}</h3>${when ? `<span class="when">${esc(when)}</span>` : ""}</div>`;

  const education = r.education.map((e) => `    <div class="item">\n${top(e.title, e.detail, e.when)}\n    </div>`).join("\n");

  const experience = r.experience.map((e) => `    <div class="item">
${top(e.title, e.org, e.when)}${e.bullets.length ? `
      <ul>
${e.bullets.map((b) => `        <li>${esc(b)}</li>`).join("\n")}
      </ul>` : ""}
    </div>`).join("\n");

  const patents = r.patents.length ? `    <ul class="list">
${r.patents.map((p) => `      <li>${tag(p.tag)}<b>${esc(p.title)}</b>${p.title && p.text ? " — " : ""}${esc(p.text)}${p.meta ? ` <span class="meta">(${esc(p.meta)})</span>` : ""}</li>`).join("\n")}
    </ul>` : "";

  const publications = r.publications.length ? `    <ul class="list">
${r.publications.map((p) => `      <li>${tag(p.tag)}<b>${esc(p.title)}</b>${p.venue ? ` <span class="meta">${esc(p.venue)}</span>` : ""}</li>`).join("\n")}
    </ul>` : "";

  const projects = r.projectGroups.map((g) => `${g.title ? `    <p class="subhead">${esc(g.title)}</p>\n` : ""}    <div class="projects">
${g.items.map((i) => `      <div class="proj"><h3>${esc(i.name)}</h3>${i.tech ? `<p class="tech">${esc(i.tech)}</p>` : ""}${i.text ? `<p>${esc(i.text)}</p>` : ""}</div>`).join("\n")}
    </div>`).join("\n");

  return head
    + section("Summary", summary)
    + section("Skills", skills)
    + section("Education", education)
    + section("Experience", experience)
    + section("Patents", patents)
    + section("Publications", publications)
    + section("Projects", projects);
}

export function renderResumePage(resume, opts = {}) {
  const r = sanitizeResume(resume);
  const embed = !!opts.embed;
  const title = `Résumé — ${r.name || "Akhilesh Kumar Bhagat"}`;
  const description = (r.summary || title).replace(/\s+/g, " ").slice(0, 155);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}resume">
<meta name="robots" content="${embed ? "noindex" : "index, follow"}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}resume">
<meta property="og:image" content="${SITE}assets/og.jpg">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@500..800&family=Funnel+Sans:wght@400..600&display=swap" rel="stylesheet">
<style>${RESUME_CSS}${embed ? EMBED_CSS : ""}</style>
</head>
<body${embed ? ' class="embed"' : ""}>
${embed ? "" : `
<nav class="bar" aria-label="Résumé actions">
  <a href="/">← Portfolio</a>
  <button type="button" onclick="window.print()">Print</button>
</nav>
`}
<main class="sheet">
${renderResumeBody(r)}
</main>

</body>
</html>
`;
}
