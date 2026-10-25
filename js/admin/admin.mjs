/*
 * /admin — edit the whole website and the résumé, preview live, publish.
 * Talks to netlify/functions/site.mjs; the password only lives in memory.
 */
import { buildForm, el } from "./form.mjs";
import { applyContent, slugify } from "../site-render.mjs";
import { renderResumePage } from "../resume-render.mjs";
import SITE_ORIGINAL from "../site-default.mjs";
import RESUME_ORIGINAL from "../resume-default.mjs";

const $ = (s) => document.querySelector(s);
const clone = (o) => JSON.parse(JSON.stringify(o));
const when = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "");

let password = "", tab = "site", template = "";
const docs = {
  site: { data: null, dirty: false, updatedAt: null, original: SITE_ORIGINAL, label: "Website" },
  resume: { data: null, dirty: false, updatedAt: null, original: RESUME_ORIGINAL, label: "Résumé" }
};

/* ================= What can be edited ================= */
const F = (key, label, type = "text", extra = {}) => Object.assign({ key, label, type }, extra);
const OUTFITS = [["polo", "Blue polo"], ["tee", "Dark tee + glasses"], ["music", "Headphones (tabla)"], ["polo-music", "Polo + headphones"], ["phone", "Holding a phone"], ["vr", "VR headset"]];
const WIDTH = F("width", "Width", "select", { options: [["full", "Full width"], ["half", "Half (sits next to another half)"]] });
const ROW = (title) => [F("tag", "Tag"), F("highlight", "Highlight the tag in blue", "checkbox"), F("title", title), F("sub", "Line under it (optional)"), F("url", "Link (optional)")];
const SECTION_NAMES = { research: "Research", experience: "Experience", resume: "Résumé", custom: "Section" };

const sectionFields = (s) => {
  const common = [
    F("hidden", "Hide this section", "checkbox"),
    F("title", "Heading"), F("subtitle", "Small line next to the heading"),
    F("say", "What the mascot says here", "text", { hint: "*word* is highlighted." })
  ];
  if (s.type === "research") return common.concat([
    F("counters", "Big numbers", "list", { inline: true, add: "Add number", item: [F("value", "Number (e.g. 3, 1000+)"), F("label", "Label")] }),
    F("patentsTitle", "Left column heading"),
    F("patents", "Left column rows", "list", { add: "Add row", one: "Row", item: ROW("Title") }),
    F("papersTitle", "Right column heading"),
    F("papers", "Right column rows", "list", { add: "Add row", one: "Row", item: ROW("Title") }),
    F("note", "Note under the lists", "textarea", { hint: "[label](https://link) makes a link; *word* makes it bold." })
  ]);
  if (s.type === "experience") return common.concat([
    F("jobs", "Roles", "list", { add: "Add role", one: "Role", title: (j) => j.title, item: [F("when", "Dates"), F("title", "Role"), F("text", "Where / details", "textarea", { rows: 2 })] }),
    F("chips", "Skill chips", "tags", { hint: "Separate with commas." })
  ]);
  if (s.type === "resume") return common.concat([
    F("lead", "Big line"),
    F("points", "Points (one per line)", "lines", { rows: 4, hint: "*7* makes the number blue." }),
    F("button", "Button text")
  ]);
  return common.concat([
    F("blocks", "Content", "list", {
      one: "Block",
      title: (b) => (b.type === "text" ? (b.text || "").split("\n")[0] : b.caption || b.alt || b.src || b.video || ""),
      badge: (b) => ({ text: "Text", image: "Image", video: "Video" })[b.type],
      item: (b) => b.type === "image"
        ? [F("src", "Image", "media", { accept: "image" }), F("alt", "Describe the image (for screen readers)"), F("caption", "Caption (optional)"), WIDTH]
        : b.type === "video"
          ? [F("video", "Video", "media", { accept: "video" }), F("caption", "Caption (optional)"), WIDTH]
          : [F("text", "Text", "textarea", { rows: 5, hint: "Blank line = new paragraph. *word* is bold, [label](https://link) is a link." }), WIDTH],
      add: [
        { label: "Text", make: () => ({ type: "text", text: "", width: "full" }) },
        { label: "Image", make: () => ({ type: "image", src: "", alt: "", caption: "", width: "full" }) },
        { label: "Video", make: () => ({ type: "video", video: "", caption: "", width: "full" }) }
      ]
    })
  ]);
};

const segmentOptions = () => (docs.site.data.segments || []).filter((s) => (s.title || "").trim()).map((s) => [s.key || slugify(s.title), s.title]);

const SITE_CARDS = [
  { title: "Page & search", target: "#hero", hint: "What Google and link previews show.", fields: [
    F("meta", "", "object", { fields: [F("title", "Page title"), F("description", "Search description", "textarea", { rows: 3 }), F("shareTitle", "Title when shared"), F("shareDescription", "Description when shared", "textarea", { rows: 2 })] })
  ] },
  { title: "Header", target: "#hero", fields: [
    F("header", "", "object", { fields: [F("name", "Name"), F("tagline", "Line under the name"), F("cta", "Button text (top right)")] })
  ] },
  { title: "Hero", target: "#hero", fields: [
    F("hero", "", "object", { fields: [F("line1", "Big line 1"), F("line2", "Big line 2"), F("say", "Mascot's greeting", "text", { hint: "*word* is highlighted." })] })
  ] },
  { title: "About", target: "#about", fields: [
    F("about", "", "object", { fields: [F("text", "About text", "textarea", { rows: 6, hint: "Fills in word by word as visitors scroll. *word* is highlighted in blue." })] })
  ] },
  { title: "Project groups", target: "#work", hint: "The tabs above the project grid. Projects pick one of these.", fields: [
    F("work", "", "object", { fields: [F("title", "Heading above the grid")] }),
    F("segments", "", "list", { add: "Add group", one: "Group", confirmRemove: "Remove this group? Its projects move to the first group.",
      make: () => ({ key: "group-" + Date.now().toString(36), title: "New group", blurb: "", say: "" }), // key stays fixed when the name changes
      item: [F("title", "Group name"), F("blurb", "One-line description"), F("say", "What the mascot says", "text", { hint: "*word* is highlighted." })] })
  ] },
  { title: "Projects", target: "#work", hint: "Featured projects also appear in the scrolling colour tour near the top.", fields: [
    F("tour", "", "object", { fields: [F("button", "Tour button text")] }),
    F("projects", "", "list", {
      one: "Project", add: "Add project", confirmRemove: "Remove this project?",
      badge: (p) => (p.featured ? "★ Featured" : ""),
      target: (p) => "#" + (p.slug || slugify(p.title)),
      make: () => ({ slug: "", title: "New project", segment: segmentOptions()[0] ? segmentOptions()[0][0] : "", label: "", summary: "", tags: [], video: "", image: "", signal: "", details: [], links: [], featured: null }),
      item: [
        F("title", "Title"),
        F("segment", "Group", "select", { options: segmentOptions }),
        F("label", "Small label (e.g. Patent · NIME ’26)"),
        F("summary", "Summary", "textarea", { rows: 3 }),
        F("video", "YouTube video", "video"),
        F("image", "Photo (used instead of the video thumbnail)", "media", { accept: "image" }),
        F("tags", "Tech", "tags", { hint: "Separate with commas." }),
        F("signal", "Text shown when there's no video or photo"),
        F("details", "Details in the pop-up (one per line)", "lines", { rows: 4 }),
        F("links", "Links", "list", { inline: true, add: "Add link", item: [F("label", "Label"), F("url", "https://…")] }),
        F("featured", "", "object", {
          toggle: "Feature in the scrolling tour",
          make: () => ({ color: "#2b5be6", ink: "#ffffff", file: "", outfit: "polo", say: ["", ""] }),
          fields: [
            F("color", "Background colour", "color"), F("ink", "Text colour", "color"),
            F("file", "File name shown on the window (e.g. demo.mp4)"),
            F("outfit", "Mascot outfit", "select", { options: OUTFITS }),
            F("say", "Mascot's two lines (one per line)", "lines", { rows: 2, hint: "*word* is highlighted." })
          ]
        })
      ]
    })
  ] },
  { title: "Sections", hint: "Everything between the projects and the footer, in this order. Add your own with text, images and videos.", fields: [
    F("sections", "", "list", {
      one: "Section",
      badge: (s) => (s.hidden ? "Hidden" : SECTION_NAMES[s.type] || "Section"),
      title: (s) => s.title,
      target: (s) => "#" + (s.type === "custom" ? (s.id || slugify(s.title)) : s.type),
      canRemove: (s) => s.type === "custom",
      confirmRemove: "Remove this section and everything in it?",
      item: sectionFields,
      add: [{ label: "New section", make: () => ({ type: "custom", id: "", title: "New section", subtitle: "", say: "", hidden: false, blocks: [{ type: "text", text: "", width: "full" }] }) }]
    })
  ] },
  { title: "Contact & footer", target: "#contact", fields: [
    F("contact", "", "object", { fields: [
      F("title", "Big heading"), F("lead", "Line under it"), F("email", "Email"),
      F("links", "Links", "list", { inline: true, add: "Add link", item: [F("label", "Label"), F("url", "https://… or /resume")] }),
      F("location", "Location (shown in the footer)")
    ] })
  ] }
];

const RESUME_CARDS = [
  { title: "Header", fields: [
    F("name", "Name"), F("headline", "Headline (shown in blue)"), F("role", "Role line"),
    F("contact", "Contact details", "list", { inline: true, add: "Add contact detail", item: [F("text", "Text"), F("url", "Link (optional)")] })
  ] },
  { title: "Summary", fields: [F("summary", "", "textarea", { rows: 6 })] },
  { title: "Skills", fields: [F("skills", "", "list", { inline: true, add: "Add skill group", item: [F("label", "Group"), F("value", "Skills")] })] },
  { title: "Education", fields: [F("education", "", "list", { inline: true, add: "Add education", item: [F("title", "School"), F("detail", "Degree / details"), F("when", "Dates")] })] },
  { title: "Experience", hint: "Newest first.", fields: [F("experience", "", "list", { add: "Add role", one: "Role",
    item: [F("title", "Role"), F("org", "Organisation"), F("when", "Dates · place"), F("bullets", "Bullet points (one per line)", "lines", { rows: 4 })] })] },
  { title: "Patents", fields: [F("patents", "", "list", { add: "Add patent", one: "Patent", title: (p) => p.text || p.title,
    item: [F("tag", "Status (e.g. Granted, Filed)"), F("title", "Number"), F("text", "Title"), F("meta", "Details (shown in brackets)")] })] },
  { title: "Publications", fields: [F("publications", "", "list", { add: "Add publication", one: "Publication",
    item: [F("tag", "Badge (optional, e.g. Best Paper)"), F("title", "Title"), F("venue", "Venue / note")] })] },
  { title: "Projects", fields: [F("projectGroups", "", "list", { add: "Add project group", one: "Group",
    item: [F("title", "Group title"), F("items", "Projects", "list", { add: "Add project", one: "Project",
      item: [F("name", "Name"), F("tech", "Tech"), F("text", "Description", "textarea")] })] })] }
];

/* ================= Server ================= */
async function api(method, path, body, headers) {
  const res = await fetch(path, {
    method,
    headers: Object.assign({}, body && !(body instanceof Blob) ? { "content-type": "application/json" } : {}, password ? { authorization: "Bearer " + password } : {}, headers || {}),
    body: body instanceof Blob ? body : body ? JSON.stringify(body) : undefined
  });
  let out = {};
  try { out = await res.json(); } catch (e) { /* not JSON */ }
  return { ok: res.ok, status: res.status, body: out };
}

// Large photos are scaled to 2000px and re-encoded before upload; GIFs and videos go as they are.
async function prepare(file) {
  if (/^video\//.test(file.type) || file.type === "image/gif") return file;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use a JPG, PNG, WebP or GIF image.");
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size < 1.2e6) return file;
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  const webp = await new Promise((r) => c.toBlob(r, "image/webp", 0.86));
  return webp && webp.type === "image/webp" ? webp : await new Promise((r) => c.toBlob(r, "image/jpeg", 0.86));
}
async function upload(file) {
  if (/^video\//.test(file.type) && !/^video\/(mp4|webm)$/.test(file.type)) throw new Error("Use an MP4 or WebM video — or put it on YouTube and paste the link.");
  const blob = await prepare(file);
  if (blob.size > 5.5 * 1024 * 1024) throw new Error("That file is over 5.5 MB. Use a smaller one, or put long videos on YouTube and paste the link.");
  const r = await api("POST", "/api/media", blob, { "x-file-name": encodeURIComponent(file.name) });
  if (r.status === 401) { lock("Sign in again to upload."); throw new Error("Not uploaded — sign in again."); }
  if (!r.ok) throw new Error(r.body.error || "Upload failed (error " + r.status + ").");
  return r.body.url;
}

/* ================= Uploads library ================= */
const library = $("#library");
async function openLibrary(accept, onPick) {
  const grid = $("#libraryGrid");
  grid.innerHTML = "";
  grid.append(el("p", "hint", "Loading…"));
  library.showModal();
  const r = await api("GET", "/api/media");
  grid.innerHTML = "";
  const items = (r.body.items || []).filter((i) => (accept === "video" ? /^video\//.test(i.type || "") : !/^video\//.test(i.type || "")));
  if (!items.length) grid.append(el("p", "hint", "Nothing uploaded yet."));
  items.forEach((it) => {
    const card = el("div", "lib__item");
    const pick = el("button", "lib__pick");
    pick.type = "button";
    if (/^video\//.test(it.type || "")) { const v = el("video"); v.src = it.url; v.muted = true; v.preload = "metadata"; pick.append(v); }
    else { const i = el("img"); i.src = it.url; i.alt = ""; i.loading = "lazy"; pick.append(i); }
    pick.append(el("span", "", decodeURIComponent(it.name || it.file)));
    pick.addEventListener("click", () => { library.close(); onPick(it.url); });
    const del = el("button", "lib__del", "Delete");
    del.type = "button";
    del.addEventListener("click", async () => {
      if (!confirm("Delete this file? Anything still using it will show a broken image.")) return;
      const d = await api("DELETE", "/api/media?file=" + encodeURIComponent(it.file));
      if (d.ok) card.remove(); else alert(d.body.error || "Couldn't delete it.");
    });
    card.append(pick, del);
    grid.append(card);
  });
}
$("#libraryClose").addEventListener("click", () => library.close());

/* ================= Preview ================= */
const frame = $("#preview"), box = $("#previewBox");
const DEVICES = { desktop: [1280, 800], phone: [390, 844] };
let device = "desktop", resumeH = 1200, timer = 0, keepY = 0, focusTarget = "";

// The page is drawn at its real width (1280 desktop, 390 phone, 860 résumé) and scaled to fit.
function size() {
  const [w, h] = tab === "resume" ? [860, resumeH] : DEVICES[device];
  const k = Math.min(1, box.parentElement.clientWidth / w);
  frame.style.width = w + "px";
  frame.style.height = h + "px";
  frame.style.transform = `scale(${k})`;
  box.style.width = Math.floor(w * k) + "px";
  box.style.height = Math.ceil(h * k) + "px";
}
new ResizeObserver(size).observe(box.parentElement);

function render() {
  const win = frame.contentWindow;
  keepY = win ? win.scrollY : 0;
  if (tab === "resume") {
    frame.setAttribute("scrolling", "no");
    frame.srcdoc = renderResumePage(docs.resume.data, { embed: true });
  } else {
    frame.removeAttribute("scrolling");
    const html = applyContent(template, docs.site.data).replace(/<head>/i, `<head><base href="${location.origin}/">`);
    frame.srcdoc = html;
  }
  size();
}
frame.addEventListener("load", () => {
  const doc = frame.contentDocument;
  if (!doc) return;
  if (tab === "resume") {
    const measure = () => { const m = doc.querySelector("main"); if (m) { resumeH = Math.ceil(m.getBoundingClientRect().bottom) + 4; size(); } };
    measure();
    if (doc.fonts) doc.fonts.ready.then(measure);
  } else {
    doc.documentElement.style.scrollBehavior = "auto";
    frame.contentWindow.scrollTo(0, keepY);
    if (focusTarget) { jump(focusTarget); focusTarget = ""; }
  }
});
function jump(selector) {
  const doc = frame.contentDocument;
  let target = null;
  try { target = doc && selector && doc.querySelector(selector); } catch (e) { /* not a valid selector yet */ }
  if (target) { doc.documentElement.style.scrollBehavior = "auto"; target.scrollIntoView({ block: "start" }); }
}
document.querySelectorAll("[data-device]").forEach((b) => b.addEventListener("click", () => {
  device = b.dataset.device;
  document.querySelectorAll("[data-device]").forEach((x) => x.classList.toggle("is-on", x === b));
  size();
}));

/* ================= Editor ================= */
const ctx = {
  changed() {
    docs[tab].dirty = true;
    status();
    clearTimeout(timer);
    timer = setTimeout(render, tab === "resume" ? 250 : 650);
  },
  focus(selector) { if (tab === "site") jump(selector); },
  upload,
  library: openLibrary
};

function show(which) {
  tab = which;
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("is-on", b.dataset.tab === which));
  $("#devices").hidden = which !== "site";
  buildForm($("#form"), which === "site" ? SITE_CARDS : RESUME_CARDS, docs[which].data, ctx);
  render();
  status();
  window.scrollTo(0, 0);
}
document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));

function status(text, kind) {
  const s = $("#status"), d = docs[tab];
  if (!text) {
    const other = docs[tab === "site" ? "resume" : "site"];
    text = d.dirty ? "Unsaved changes" + (other.dirty ? " (in both tabs)" : "") : other.dirty ? "Unsaved changes in the " + other.label + " tab" : d.updatedAt ? "Published " + when(d.updatedAt) : "Showing the original — nothing published yet";
    kind = d.dirty || other.dirty ? "dirty" : "";
  }
  s.textContent = text;
  s.className = "status" + (kind ? " is-" + kind : "");
  $("#save").disabled = !docs.site.dirty && !docs.resume.dirty;
  document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("is-dirty", docs[b.dataset.tab].dirty));
}

/* ================= Sign in ================= */
$("#login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#loginMsg"), btn = $("#login button");
  msg.textContent = "";
  btn.disabled = true;
  password = $("#pw").value;
  try {
    const v = await api("POST", "/api/auth");
    if (!v.ok) {
      password = "";
      msg.textContent = v.body.error || ([404, 405, 501].includes(v.status) ? "The editor only works on the live site (krakhilesh.netlify.app/admin)." : "Couldn't sign in (error " + v.status + ").");
      return;
    }
    $("#pw").value = "";
    $("#gate").hidden = true;
    $("#app").hidden = false;
    if (docs.site.data) { status(); return; } // signed in again: keep the edits
    const [site, resume, page] = await Promise.all([api("GET", "/api/site"), api("GET", "/api/resume"), fetch("/", { cache: "no-store" }).then((r) => r.text())]);
    docs.site.data = clone(site.body.site || SITE_ORIGINAL);
    docs.site.updatedAt = site.body.updatedAt;
    docs.resume.data = clone(resume.body.resume || RESUME_ORIGINAL);
    docs.resume.updatedAt = resume.body.updatedAt;
    template = page;
    show("site");
  } catch (err) {
    password = "";
    msg.textContent = "Couldn't reach the site. Check your connection and try again.";
  } finally {
    btn.disabled = false;
  }
});

/* ================= Actions ================= */
async function save() {
  $("#save").disabled = true;
  status("Publishing…");
  for (const kind of ["site", "resume"]) {
    const d = docs[kind];
    if (!d.dirty) continue;
    try {
      const r = await api("PUT", "/api/" + kind, { [kind]: d.data });
      if (r.status === 401) { lock("Your password didn't work — sign in again. Your edits are still here."); return; }
      if (!r.ok) { status(d.label + ": " + (r.body.error || "couldn't publish (error " + r.status + ")"), "bad"); $("#save").disabled = false; return; }
      d.dirty = false;
      d.updatedAt = r.body.updatedAt;
    } catch (err) {
      status("Couldn't reach the site — " + d.label + " wasn't published", "bad");
      $("#save").disabled = false;
      return;
    }
  }
  status("Published " + when(docs[tab].updatedAt || new Date().toISOString()) + " ✓ — live now", "ok");
}
$("#save").addEventListener("click", save);
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !$("#app").hidden) { e.preventDefault(); if (docs.site.dirty || docs.resume.dirty) save(); }
});

$("#restore").addEventListener("click", () => {
  const d = docs[tab];
  if (!confirm(`Replace everything in the ${d.label} tab with the original version? Nothing changes on the site until you publish.`)) return;
  d.data = clone(d.original);
  show(tab);
  ctx.changed();
});

function lock(message) {
  password = "";
  $("#app").hidden = true;
  $("#gate").hidden = false;
  $("#loginMsg").textContent = message || "";
  $("#pw").focus();
}
$("#lock").addEventListener("click", () => {
  if ((docs.site.dirty || docs.resume.dirty) && !confirm("You have unsaved changes. Lock anyway? They stay here until you close this tab.")) return;
  lock();
});
window.addEventListener("beforeunload", (e) => { if (docs.site.dirty || docs.resume.dirty) { e.preventDefault(); e.returnValue = ""; } });
