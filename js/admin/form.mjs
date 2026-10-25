/*
 * A small form builder for the /admin editor. A schema of cards and fields is
 * turned into inputs that edit a plain data object in place; ctx.changed() is
 * called after every edit.
 *
 * Field types: text (default), textarea, lines (array, one per line), tags
 * (array, comma separated), checkbox, select, color, video (YouTube link),
 * media (upload or link to an image/video), object (nested, optionally switched
 * on and off) and list (add / remove / reorder; rows or collapsible cards).
 */
import { parseVideo } from "../site-render.mjs";

export const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const grow = (t) => { t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; };
const fieldsOf = (f, item) => (typeof f.item === "function" ? f.item(item) : f.item);

export function buildForm(root, cards, data, ctx) {
  root.innerHTML = "";
  cards.forEach((card) => {
    const sec = el("section", "card");
    if (card.target) sec.addEventListener("focusin", () => ctx.focus && ctx.focus(card.target));
    sec.append(el("h2", "", card.title));
    if (card.hint) sec.append(el("p", "hint", card.hint));
    card.fields.forEach((f) => sec.append(field(f, data, ctx)));
    root.append(sec);
  });
}

function field(f, target, ctx) {
  const type = f.type || "text";
  if (type === "list") return list(f, target, ctx);
  if (type === "object") return object(f, target, ctx);
  if (type === "checkbox") return checkbox(f, target, ctx);
  // Fields with several controls get a plain wrapper so a click on the label doesn't trigger a button
  const wrap = el(type === "media" || type === "color" ? "div" : "label", "field");
  if (f.label) wrap.append(el("span", "field__label", f.label));
  if (type === "select") wrap.append(select(f, target, ctx));
  else if (type === "color") wrap.append(colour(f, target, ctx));
  else if (type === "media") wrap.append(media(f, target, ctx));
  else wrap.append(text(f, target, ctx));
  if (f.hint) wrap.append(el("span", "field__hint", f.hint));
  return wrap;
}

function text(f, target, ctx) {
  const type = f.type || "text";
  const multi = type === "textarea" || type === "lines";
  const input = document.createElement(multi ? "textarea" : "input");
  if (multi) input.rows = f.rows || 3; else input.type = "text";
  if (f.placeholder) input.placeholder = f.placeholder;
  const v = target[f.key];
  input.value = type === "lines" ? (v || []).join("\n") : type === "tags" ? (v || []).join(", ") : type === "video" ? videoText(v) : v == null ? "" : String(v);
  const note = type === "video" ? el("span", "field__hint") : null;
  const update = () => {
    if (type === "lines") target[f.key] = input.value.split("\n");
    else if (type === "tags") target[f.key] = input.value.split(",").map((s) => s.trim()).filter(Boolean);
    else target[f.key] = input.value;
    if (note) {
      const p = parseVideo(input.value);
      note.textContent = !input.value.trim() ? "Paste a YouTube link (normal video or Short)." : p ? `✓ YouTube ${p.short ? "Short" : "video"} ${p.id}` : "That doesn't look like a YouTube link.";
      note.classList.toggle("is-bad", !!input.value.trim() && !p);
    }
  };
  input.addEventListener("input", () => { update(); if (multi) grow(input); ctx.changed(); });
  if (multi) requestAnimationFrame(() => grow(input));
  if (!note) return input;
  update();
  const box = el("span", "stack");
  box.append(input, note);
  return box;
}
const videoText = (v) => (v && typeof v === "object" ? (v.short ? "https://www.youtube.com/shorts/" : "https://youtu.be/") + v.id : v || "");

function checkbox(f, target, ctx) {
  const wrap = el("label", "check");
  const input = el("input");
  input.type = "checkbox";
  input.checked = !!target[f.key];
  input.addEventListener("change", () => { target[f.key] = input.checked; ctx.changed(); });
  wrap.append(input, el("span", "", f.label));
  return wrap;
}

function select(f, target, ctx) {
  const s = el("select");
  const fill = () => {
    const opts = typeof f.options === "function" ? f.options(ctx) : f.options;
    const current = target[f.key];
    s.innerHTML = "";
    opts.forEach(([value, label]) => { const o = el("option", "", label); o.value = value; s.append(o); });
    if (opts.some(([v]) => v === current)) s.value = current;
    else if (opts.length) { s.value = opts[0][0]; target[f.key] = opts[0][0]; }
  };
  fill();
  s.addEventListener("focus", fill);
  s.addEventListener("change", () => { target[f.key] = s.value; ctx.changed(); });
  return s;
}

function colour(f, target, ctx) {
  const box = el("span", "colour");
  const pick = el("input"), hex = el("input");
  pick.type = "color"; hex.type = "text";
  const set = (v) => { pick.value = /^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"; hex.value = v || ""; };
  set(target[f.key] || f.default || "#2b5be6");
  pick.addEventListener("input", () => { hex.value = pick.value; target[f.key] = pick.value; ctx.changed(); });
  hex.addEventListener("input", () => { if (/^#[0-9a-f]{6}$/i.test(hex.value)) pick.value = hex.value; target[f.key] = hex.value; ctx.changed(); });
  box.append(pick, hex);
  return box;
}

// Link or upload. accept: "image" | "video"; video fields also take YouTube links.
function media(f, target, ctx) {
  const box = el("span", "media");
  const row = el("span", "media__row");
  const input = el("input");
  input.type = "text";
  input.placeholder = f.placeholder || (f.accept === "video" ? "YouTube link, or upload an MP4" : "Upload a photo, or paste an image link");
  input.value = target[f.key] || "";
  const up = el("button", "mini", "Upload"), lib = el("button", "mini", "Uploads"), clear = el("button", "mini", "Clear");
  up.type = lib.type = clear.type = "button";
  const file = el("input");
  file.type = "file";
  file.accept = f.accept === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif";
  file.hidden = true;
  const note = el("span", "field__hint"), thumb = el("span", "media__thumb");
  const show = () => {
    const v = input.value.trim(), yt = parseVideo(v);
    thumb.innerHTML = "";
    if (!v) { thumb.hidden = true; return; }
    thumb.hidden = false;
    if (yt) { const i = el("img"); i.src = `https://i.ytimg.com/vi/${yt.id}/hqdefault.jpg`; i.alt = ""; thumb.append(i); return; }
    if (/\.(mp4|webm)(\?|$)/i.test(v)) { const vd = el("video"); vd.src = v; vd.muted = true; vd.preload = "metadata"; thumb.append(vd); return; }
    const i = el("img"); i.src = v; i.alt = ""; thumb.append(i);
  };
  const set = (v) => { input.value = v; target[f.key] = v; show(); ctx.changed(); };
  input.addEventListener("input", () => { target[f.key] = input.value; show(); ctx.changed(); });
  up.addEventListener("click", () => file.click());
  clear.addEventListener("click", () => set(""));
  lib.addEventListener("click", () => ctx.library(f.accept || "image", (url) => set(url)));
  file.addEventListener("change", async () => {
    const chosen = file.files[0];
    file.value = "";
    if (!chosen) return;
    up.disabled = true;
    note.classList.remove("is-bad");
    note.textContent = "Uploading " + chosen.name + "…";
    try {
      set(await ctx.upload(chosen));
      note.textContent = "Uploaded ✓";
    } catch (err) {
      note.textContent = err.message;
      note.classList.add("is-bad");
    }
    up.disabled = false;
  });
  row.append(input, up, lib, clear);
  box.append(row, file, note, thumb);
  show();
  return box;
}

function object(f, target, ctx) {
  const box = el("div", "obj");
  const body = el("div", "obj__body");
  const draw = () => {
    body.innerHTML = "";
    if (target[f.key]) f.fields.forEach((sf) => body.append(field(sf, target[f.key], ctx)));
  };
  if (f.toggle) {
    const wrap = el("label", "check");
    const input = el("input");
    input.type = "checkbox";
    input.checked = !!target[f.key];
    input.addEventListener("change", () => {
      target[f.key] = input.checked ? (target[f.key] || f.make()) : null;
      draw();
      ctx.changed();
    });
    wrap.append(input, el("span", "", f.toggle));
    box.append(wrap);
  } else if (!target[f.key] || typeof target[f.key] !== "object") {
    target[f.key] = {};
  }
  box.append(body);
  draw();
  return box;
}

function tools(arr, i, f, redraw, ctx) {
  const box = el("span", "tools");
  const btn = (label, title, cls, fn) => {
    const b = el("button", cls, label);
    b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
    b.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); if (fn() === false) return; redraw(); ctx.changed(); });
    box.append(b);
  };
  if (i > 0) btn("↑", "Move up", "", () => arr.splice(i - 1, 0, arr.splice(i, 1)[0]));
  if (i < arr.length - 1) btn("↓", "Move down", "", () => arr.splice(i + 1, 0, arr.splice(i, 1)[0]));
  if (!f.canRemove || f.canRemove(arr[i])) btn("✕", "Remove", "del", () => { if (!confirm(f.confirmRemove || "Remove this?")) return false; arr.splice(i, 1); });
  return box;
}

function list(f, target, ctx) {
  if (!Array.isArray(target[f.key])) target[f.key] = [];
  const arr = target[f.key];
  const box = el("div", f.label ? "list sub" : "list");
  if (f.label) box.append(el("span", "field__label", f.label));
  if (f.hint) box.append(el("span", "field__hint", f.hint));
  const items = el("div", "list__items");
  box.append(items);
  let openIndex = -1;
  const nameOf = (item, i) => {
    const t = f.title ? f.title(item, i) : item[fieldsOf(f, item)[0].key];
    return (t == null ? "" : String(t)).trim() || `${f.one || "Item"} ${i + 1}`;
  };
  const draw = () => {
    items.innerHTML = "";
    arr.forEach((item, i) => {
      if (f.inline) {
        const row = el("div", "row" + (fieldsOf(f, item).length === 3 ? " row--3" : ""));
        fieldsOf(f, item).forEach((sf) => row.append(field(sf, item, ctx)));
        row.append(tools(arr, i, f, draw, ctx));
        items.append(row);
        return;
      }
      const card = el("details", "item");
      if (i === openIndex) card.open = true;
      const sum = el("summary");
      const name = el("span", "item__name", nameOf(item, i));
      if (f.badge) { const b = f.badge(item); if (b) sum.append(el("span", "badge", b)); }
      sum.append(name, tools(arr, i, f, draw, ctx));
      const body = el("div", "item__body");
      fieldsOf(f, item).forEach((sf) => body.append(field(sf, item, ctx)));
      body.addEventListener("input", () => { name.textContent = nameOf(item, i); });
      card.append(sum, body);
      if (f.target) card.addEventListener("toggle", () => { if (card.open) ctx.focus && ctx.focus(f.target(item)); });
      items.append(card);
    });
    openIndex = -1;
  };
  draw();
  const adds = Array.isArray(f.add) ? f.add : [{ label: f.add || "Add", make: f.make }];
  const bar = el("div", "adds");
  adds.forEach((a) => {
    const add = el("button", "add", "+ " + a.label);
    add.type = "button";
    add.addEventListener("click", () => {
      arr.push(a.make ? a.make() : Object.fromEntries(fieldsOf(f, {}).map((sf) => [sf.key, ["list", "lines", "tags"].includes(sf.type) ? [] : sf.type === "checkbox" ? false : ""])));
      openIndex = arr.length - 1;
      draw();
      ctx.changed();
      const last = items.lastElementChild;
      const first = last && last.querySelector("input:not([type=checkbox]):not([type=color]), textarea, select");
      if (first) first.focus();
    });
    bar.append(add);
  });
  box.append(bar);
  return box;
}
