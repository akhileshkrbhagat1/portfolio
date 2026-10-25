/*
 * Regenerates the crawlable parts of the site from js/data.js:
 *   - project groups + tiles inside index.html   (between <!-- build:work --> markers)
 *   - group navigation                             (between <!-- build:nav --> markers)
 *   - JSON-LD structured data                      (between <!-- build:jsonld --> markers)
 *   - sitemap.xml and llms.txt
 *
 * Search engines and AI assistants read plain HTML, so this keeps every project
 * visible to them without JavaScript. No dependencies. Run after editing data.js:
 *
 *     node tools/build.js
 *
 * The generated files are committed, so Netlify needs no build step.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://krakhilesh.netlify.app/";
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8"), sandbox);
const { segments, projects } = sandbox.window.SITE;

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const yt = (id, file) => `https://i.ytimg.com/vi/${id}/${file}.jpg`;
const watch = (v) => (v.short ? "https://www.youtube.com/shorts/" : "https://www.youtube.com/watch?v=") + v.id;
const pad = (n) => String(n).padStart(2, "0");

/* ---------- Static HTML: group navigation + tiles ---------- */
function tileMedia(p) {
  const alt = esc(`${p.title} — demo video`);
  if (!p.video) return `<span class="tile__media tile__media--blank"><span>${esc(p.signal || p.tags.join(" · "))}</span></span>`;
  if (p.video.short) return `<span class="tile__media tile__media--short" style="--img:url('${yt(p.video.id, "hqdefault")}')" role="img" aria-label="${alt}"><span class="tile__poster"></span><span class="tile__chip">Short</span></span>`;
  return `<span class="tile__media" data-flip="${esc(p.video.id)}"><img src="${yt(p.video.id, "hqdefault")}" class="is-lb" data-poster="${esc(p.video.id)}" alt="${alt}" width="480" height="360" loading="lazy" decoding="async"></span>`;
}

function tile(p, i) {
  const links = [];
  if (p.video) links.push(`<a href="${watch(p.video)}" target="_blank" rel="noopener">Watch the demo</a>`);
  (p.links || []).forEach((l) => links.push(`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`));
  return `
          <article class="tile reveal" id="${esc(p.slug)}" style="--d:${(i % 3) * 110}ms" data-project="${esc(p.slug)}" data-cursor="${p.video ? "Play" : "Open"}">
            ${tileMedia(p)}
            <div class="tile__cap"><h4 class="tile__title"><button type="button">${esc(p.title)}</button></h4><span class="tile__label">${esc(p.label || "")}</span></div>
            <p class="tile__sum">${esc(p.summary)}</p>
            <p class="tile__more">${esc(p.tags.join(" · "))}${links.length ? " — " + links.join(" · ") : ""}</p>
          </article>`;
}

const navHtml = segments.map((s) => {
  const n = projects.filter((p) => p.segment === s.key).length;
  return `<a href="#seg-${s.key}" data-seg="${s.key}">${esc(s.title)}<sup>${n}</sup></a>`;
}).join("\n        ");

const workHtml = segments.map((s, si) => {
  const list = projects.filter((p) => p.segment === s.key);
  return `
      <section class="seg" id="seg-${s.key}" data-say="${esc(s.say)}" data-outfit="${si % 2 ? "polo" : "tee"}" aria-labelledby="seg-${s.key}-title">
        <header class="seg__head reveal"><span class="seg__no">${pad(si + 1)}</span><h3 id="seg-${s.key}-title" data-split>${esc(s.title)}</h3><p>${esc(s.blurb)}</p></header>
        <div class="tiles">${list.map(tile).join("")}
        </div>
      </section>`;
}).join("");

/* ---------- JSON-LD ---------- */
const person = {
  "@type": "Person",
  "@id": SITE_URL + "#person",
  name: "Akhilesh Kumar Bhagat",
  alternateName: ["Akhilesh kr Bhagat", "Akhilesh Bhagat", "krakhilesh"],
  url: SITE_URL,
  image: SITE_URL + "assets/og.jpg",
  email: "mailto:akhileshkrbhagat1@gmail.com",
  jobTitle: "Embedded Systems Engineer · Student Research Assistant, National Quantum Mission, IIT Kanpur",
  description: "Electronic Systems student at IIT Madras and Student Research Assistant at IIT Kanpur under India's National Quantum Mission. Works across embedded systems, HCI, assistive technology and robotics, with three patents and research publications at CHI, UIST and NIME. Builds human-centred hardware, from interactive musical interfaces to assistive devices and intelligent robots.",
  address: { "@type": "PostalAddress", addressRegion: "West Bengal", addressCountry: "IN" },
  affiliation: [
    { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Madras", sameAs: "https://www.iitm.ac.in/" },
    { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Kanpur", sameAs: "https://www.iitk.ac.in/" },
    { "@type": "Organization", name: "National Quantum Mission (India)" }
  ],
  worksFor: { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Kanpur" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology Madras" },
  award: ["Best Paper Award, INDIS 2026 (IIT Guwahati) — PathBuddy", "Indian Patent No. 588076 — Wearable Musical Device for Simulating Indian Classical Percussion Audio", "Indian Patent No. 587794 — A Musical Instrument (Swarings)"],
  knowsAbout: ["Embedded systems", "Firmware", "ESP32", "STM32", "FreeRTOS", "Linux device drivers", "Raspberry Pi", "IoT", "MQTT", "ESP-NOW", "Robotics", "ROS 2", "Computer vision", "OpenCV", "Human–computer interaction", "Assistive technology", "New interfaces for musical expression", "Hardware prototyping"],
  sameAs: [
    "https://www.linkedin.com/in/krakhilesh/",
    "https://github.com/akhileshkrbhagat1",
    "https://scholar.google.com/citations?user=IMn1kfAAAAAJ"
  ]
};

const papers = [
  ["PathBuddy: A Smart Solution to Prevent Smartphone-Induced Jaywalking Risks with Enhanced Obstacle Awareness", "INDIS 2026 — International Conference on Design and Innovation Studies, IIT Guwahati", "2026", null],
  ["When Assistive Technologies become Provocations: Unpacking Access in HCI practices using Crip Technoscience, Mouth Interfaces, and XR", "CHI 2026 — ACM Conference on Human Factors in Computing Systems", "2026-04-13", "https://dl.acm.org/doi/abs/10.1145/3772318.3791535"],
  ["Designing a Scaffolding for the Audience to Create Participatory Sense-making in Indian Classical Dance", "ACM Creativity & Cognition 2026", "2026-07-13", "https://dl.acm.org/doi/abs/10.1145/3803784.3816837"],
  ["Layika: A Wearable Device Mapping Traditional Hand Gestures to Tabla Sound", "NIME 2026 — New Interfaces for Musical Expression", "2026-06-23", null],
  ["Swarings: Exploring Expressive Freedom through Ring-Based Musical Interaction", "UIST 2025 Adjunct — ACM Symposium on User Interface Software and Technology", "2025-09-28", "https://dl.acm.org/doi/abs/10.1145/3746058.3758455"],
  ["GraviTone: A Tangible Musical Interface using Gravity Well for Sound and Music Creation", "NIME 2025 — New Interfaces for Musical Expression", "2025", "https://nime.org/proc/nime2025_95/index.html"]
];

const graph = [
  { "@type": "WebSite", "@id": SITE_URL + "#website", url: SITE_URL, name: "Akhilesh Kumar Bhagat — Portfolio", inLanguage: "en", publisher: { "@id": SITE_URL + "#person" } },
  { "@type": "ProfilePage", "@id": SITE_URL + "#profile", url: SITE_URL, name: "Akhilesh Kumar Bhagat — Embedded Systems Engineer", isPartOf: { "@id": SITE_URL + "#website" }, mainEntity: { "@id": SITE_URL + "#person" }, dateModified: new Date().toISOString().slice(0, 10) },
  person,
  {
    "@type": "ItemList",
    name: "Projects by Akhilesh Kumar Bhagat",
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: Object.assign({
        "@type": "CreativeWork",
        name: p.title,
        url: SITE_URL + "#" + p.slug,
        description: [p.summary].concat(p.details || []).join(" "),
        keywords: p.tags.join(", "),
        genre: (segments.find((s) => s.key === p.segment) || {}).title,
        creator: { "@id": SITE_URL + "#person" }
      }, p.video ? {
        video: { "@type": "VideoObject", name: p.title + " — demo", description: p.summary, thumbnailUrl: yt(p.video.id, "hqdefault"), embedUrl: "https://www.youtube.com/embed/" + p.video.id, contentUrl: watch(p.video) }
      } : {})
    }))
  }
].concat(papers.map(([title, venue, date, url]) => Object.assign({
  "@type": "ScholarlyArticle",
  headline: title,
  name: title,
  datePublished: date,
  isPartOf: { "@type": "PublicationEvent", name: venue },
  author: { "@id": SITE_URL + "#person" }
}, url ? { url } : {})));

const jsonld = `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2)}\n</script>`;

/* ---------- Write into index.html ---------- */
function inject(html, name, content) {
  const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
  if (!re.test(html)) throw new Error("marker build:" + name + " not found in index.html");
  return html.replace(re, `$1\n${content}\n$2`);
}
let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
html = inject(html, "jsonld", jsonld);
html = inject(html, "nav", "        " + navHtml);
html = inject(html, "work", workHtml);
html = html.replace(/(<p id="workCount">)[^<]*(<\/p>)/, `$1${projects.length} projects in ${segments.length} groups$2`);
fs.writeFileSync(path.join(ROOT, "index.html"), html);

/* ---------- sitemap.xml ---------- */
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image><image:loc>${SITE_URL}assets/og.jpg</image:loc></image:image>
  </url>
  <url>
    <loc>${SITE_URL}resume</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}llms.txt</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>
`);

/* ---------- llms.txt (plain-text profile for AI assistants) ---------- */
const lines = [];
lines.push("# Akhilesh Kumar Bhagat", "");
lines.push("> Electronic Systems student at IIT Madras and Student Research Assistant at IIT Kanpur under India's National Quantum Mission. Works across embedded systems, HCI, assistive technology and robotics, with three patents (two granted) and research publications at CHI, UIST, NIME and Creativity & Cognition, plus a Best Paper Award at INDIS 2026. Builds human-centred hardware, from interactive musical interfaces to assistive devices and intelligent robots.", "");
lines.push("- Website: " + SITE_URL);
lines.push("- Email: akhileshkrbhagat1@gmail.com");
lines.push("- LinkedIn: https://www.linkedin.com/in/krakhilesh/");
lines.push("- GitHub: https://github.com/akhileshkrbhagat1");
lines.push("- Google Scholar: https://scholar.google.com/citations?user=IMn1kfAAAAAJ");
lines.push("- Résumé: " + SITE_URL + "resume");
lines.push("- Location: West Bengal, India");
lines.push("- Open to: embedded systems, firmware, IoT and robotics R&D roles; research internships; collaborations", "");
lines.push("## Experience", "");
[
  "Student Research Assistant — IIT Kanpur, National Quantum Mission (Jul 2026 – present)",
  "Teaching Assistant, School Connect — CODE, IIT Madras (Dec 2025 – present)",
  "Project Assistant — IIT Madras (Apr – Jun 2026)",
  "Research Intern — HIVE Lab, IIT Kanpur (Nov 2024 – Mar 2026): 10+ hardware prototypes, co-inventor on 3 patents, co-author of 6 papers; mentored 20+ Master's and PhD students",
  "Founder & Secretary — Yantra Robotics Society, IIT Madras BS (Aug 2024 – Jul 2026): 30-member core team, 1000+ members, 30+ hands-on sessions",
  "Event Coordinator & Exhibitor — Techkriti 2025, IIT Kanpur (Mar 2025)",
  "Group Lead — Saranda House, IIT Madras BS (Aug – Nov 2024)",
  "Education: BS in Electronic Systems, IIT Madras (2023 – 2027)"
].forEach((l) => lines.push("- " + l));
lines.push("", "## Patents", "");
lines.push("- Indian Patent No. 588076 (granted) — Wearable Musical Device for Simulating Indian Classical Percussion Audio (the Tabla Glove / Layika). Application 202511071234.");
lines.push("- Indian Patent No. 587794 (granted) — A Musical Instrument (Swarings, ring-based MIDI controller). Application 202511072744.");
lines.push("- Patent application 202511070920 (filed Nov 2025) — Real-Time Visual Feedback System and Method for Minimizing the Risk of Jaywalking or Distracted Walking (PathBuddy).");
lines.push("", "## Publications", "");
papers.forEach(([t, v, d, u]) => lines.push(`- ${t}. ${v}${u ? ". " + u : ""}`));
lines.push("- Posters & demos at India HCI 2025: GraviTone; Swarings; The Tabla Glove — An Accompanist for Musical Training and Exploration.");
lines.push("", "## Projects", "");
segments.forEach((s) => {
  lines.push("### " + s.title, "");
  projects.filter((p) => p.segment === s.key).forEach((p) => {
    lines.push(`- **${p.title}** (${p.label}) — ${p.summary}`);
    (p.details || []).forEach((d) => lines.push("  - " + d));
    lines.push("  - Tech: " + p.tags.join(", "));
    if (p.video) lines.push("  - Video: " + watch(p.video));
    (p.links || []).forEach((l) => lines.push(`  - ${l.label}: ${l.url}`));
  });
  lines.push("");
});
lines.push("## Skills", "");
lines.push("Embedded C, C, Python, Bash, Verilog, JavaScript · ESP32, STM32, Arduino, Seeeduino XIAO, Raspberry Pi & Pico, NVIDIA Jetson, Intel RealSense · MQTT, ESP-NOW, SPI, I²C, UART, CAN · FreeRTOS, Linux device drivers, ROS 2 · OpenCV, LTspice, Fusion, Blender, Git");
fs.writeFileSync(path.join(ROOT, "llms.txt"), lines.join("\n") + "\n");

console.log(`built: ${projects.length} projects in ${segments.length} groups → index.html, sitemap.xml, llms.txt`);
