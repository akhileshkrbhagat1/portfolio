/*
 * Site function (Netlify Functions v2) — serves what /admin publishes.
 *
 *   GET  /                 home page: index.html with the saved content rendered in
 *   GET  /llms.txt         plain-text profile, from the same content
 *   GET  /resume           résumé page (?embed=1: just the sheet, for the home-page preview)
 *   GET  /media/<file>     an uploaded image or video
 *
 *   POST /api/auth         checks the admin password
 *   GET  /api/site         { site, updatedAt, source: "saved" | "original" }
 *   PUT  /api/site         publish { site }
 *   GET  /api/resume       { resume, updatedAt, source }
 *   PUT  /api/resume       publish { resume }
 *   GET  /api/media        list uploads          POST /api/media   upload (raw file body)
 *   DELETE /api/media?file=<file>                remove an upload
 *
 * Writes need "Authorization: Bearer <password>"; the password is the
 * ADMIN_PASSWORD environment variable in Netlify. Content and uploads live in
 * Netlify Blobs. Pages are cached on Netlify's CDN and purged on every publish.
 * If anything goes wrong while rendering, the built-in page is served instead.
 */
import { getStore } from "@netlify/blobs";
import { purgeCache } from "@netlify/functions";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { applyContent, renderLlms, sanitizeSite } from "../../js/site-render.mjs";
import { renderResumePage, sanitizeResume } from "../../js/resume-render.mjs";
import SITE_ORIGINAL from "../../js/site-default.mjs";
import RESUME_ORIGINAL from "../../js/resume-default.mjs";
import { HOME } from "../lib/templates.mjs";

const SECURITY = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN"
};
// Browsers always revalidate; the CDN keeps a copy until the next publish purges it.
const cached = (tag) => ({
  "cache-control": "public, max-age=0, must-revalidate",
  "netlify-cdn-cache-control": "public, durable, s-maxage=86400, stale-while-revalidate=60",
  "netlify-cache-tag": tag
});
const MEDIA_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", mp4: "video/mp4", webm: "video/webm" };
const EXT_FOR = Object.fromEntries(Object.entries(MEDIA_TYPES).map(([e, t]) => [t, e]));
const MEDIA_FILE = /^[a-z0-9-]{6,80}\.(jpg|png|webp|gif|mp4|webm)$/;
const MAX_UPLOAD = 5.5 * 1024 * 1024; // Netlify Functions accept up to 6 MB per request

const content = () => getStore({ name: "site", consistency: "strong" });
const media = () => getStore({ name: "media", consistency: "strong" });

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...SECURITY, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
// Pages served after a storage error aren't kept on the CDN, so the next visit tries again.
const page = (body, type, tag, keep = true) => new Response(body, {
  headers: { ...SECURITY, ...(keep ? cached(tag) : { "cache-control": "no-store" }), "content-type": type }
});

/* ---------- Saved content ---------- */
const KINDS = {
  site: { key: "content", original: SITE_ORIGINAL, clean: sanitizeSite, tag: "site" },
  resume: { key: "resume", original: RESUME_ORIGINAL, clean: sanitizeResume, tag: "resume" }
};
async function load(kind) {
  const k = KINDS[kind];
  try {
    const saved = await content().get(k.key, { type: "json" });
    if (saved && saved.data) return { data: k.clean(saved.data), updatedAt: saved.updatedAt || null, source: "saved" };
  } catch (err) {
    console.error(`Could not read the saved ${kind}:`, err);
    return { data: k.clean(k.original), updatedAt: null, source: "error" };
  }
  return { data: k.clean(k.original), updatedAt: null, source: "original" };
}

/* ---------- Password ---------- */
async function checkPassword(req) {
  const expected = (globalThis.Netlify && Netlify.env.get("ADMIN_PASSWORD")) || process.env.ADMIN_PASSWORD;
  if (!expected) return null;
  const header = req.headers.get("authorization") || "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const hash = (s) => createHash("sha256").update(s, "utf8").digest();
  const ok = given.length > 0 && timingSafeEqual(hash(given), hash(expected));
  if (!ok) await new Promise((r) => setTimeout(r, 900)); // slows down guessing
  return ok;
}
async function guard(req) {
  const ok = await checkPassword(req);
  if (ok === null) return json({ error: "The admin password isn't set up yet. Add ADMIN_PASSWORD in Netlify, then redeploy." }, 503);
  if (!ok) return json({ error: "Wrong password." }, 401);
  return null;
}

async function purge(tag) {
  try { await purgeCache({ tags: [tag] }); } catch (err) { console.error("Cache purge failed:", err.message); }
}

/* ---------- Publishing ---------- */
async function publish(req, kind) {
  const k = KINDS[kind];
  const raw = await req.text();
  if (raw.length > 600000) return json({ error: "That's too much to save in one go." }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "Couldn't read the data that was sent." }, 400); }
  const data = k.clean(body && body[kind]);
  if (kind === "site" && !data.header.name) return json({ error: "The site needs a name in the header." }, 400);
  if (kind === "resume" && !data.name) return json({ error: "The résumé needs a name." }, 400);
  const updatedAt = new Date().toISOString();
  await content().setJSON(k.key, { data, updatedAt });
  await purge(k.tag);
  return json({ ok: true, updatedAt, [kind]: data });
}

/* ---------- Uploads ---------- */
async function upload(req) {
  const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  const ext = EXT_FOR[type];
  if (!ext) return json({ error: "Only JPG, PNG, WebP, GIF, MP4 and WebM files can be uploaded." }, 415);
  const buf = new Uint8Array(await req.arrayBuffer());
  if (!buf.length) return json({ error: "The file is empty." }, 400);
  if (buf.length > MAX_UPLOAD) return json({ error: "That file is over 5.5 MB. Use a smaller one, or put long videos on YouTube." }, 413);
  const name = (req.headers.get("x-file-name") || "").slice(0, 120);
  const file = `${Date.now().toString(36)}-${randomBytes(5).toString("hex")}.${ext}`;
  await media().set(file, buf, { metadata: { type, size: buf.length, name, uploadedAt: new Date().toISOString() } });
  return json({ ok: true, url: "/media/" + file, file });
}

async function listMedia() {
  const { blobs } = await media().list();
  const items = await Promise.all(blobs.slice(0, 300).map(async ({ key }) => {
    const meta = await media().getMetadata(key).catch(() => null);
    return { file: key, url: "/media/" + key, ...(meta ? meta.metadata : {}) };
  }));
  items.sort((a, b) => String(b.uploadedAt || "").localeCompare(String(a.uploadedAt || "")));
  return json({ items });
}

async function serveMedia(file) {
  if (!MEDIA_FILE.test(file)) return new Response("Not found", { status: 404 });
  const data = await media().get(file, { type: "arrayBuffer" });
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(data, {
    headers: {
      ...SECURITY,
      "content-type": MEDIA_TYPES[file.split(".").pop()],
      "content-disposition": "inline",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}

/* ---------- Router ---------- */
export default async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const read = req.method === "GET" || req.method === "HEAD";

  try {
    if (path === "/" && read) {
      const { data, source } = await load("site");
      let html = HOME;
      if (source === "saved") {
        try { html = applyContent(HOME, data); } catch (err) { console.error("Render failed, serving the built-in page:", err); }
      }
      return page(html, "text/html; charset=utf-8", "site", source !== "error");
    }
    if (path === "/llms.txt" && read) {
      const { data, source } = await load("site");
      return page(renderLlms(data), "text/plain; charset=utf-8", "site", source !== "error");
    }
    if (path === "/resume" && read) {
      const { data, source } = await load("resume");
      return page(renderResumePage(data, { embed: url.searchParams.has("embed") }), "text/html; charset=utf-8", "resume", source !== "error");
    }
    if (path.startsWith("/media/") && read) return await serveMedia(path.slice(7));

    if (path === "/api/auth" && req.method === "POST") return (await guard(req)) || json({ ok: true });

    if (path === "/api/site" || path === "/api/resume") {
      const kind = path.slice(5);
      if (req.method === "GET") { const r = await load(kind); return json({ [kind]: r.data, updatedAt: r.updatedAt, source: r.source }); }
      if (req.method === "PUT") return (await guard(req)) || (await publish(req, kind));
      return json({ error: "Method not allowed" }, 405);
    }

    if (path === "/api/media") {
      const denied = await guard(req);
      if (denied) return denied;
      if (req.method === "GET") return await listMedia();
      if (req.method === "POST") return await upload(req);
      if (req.method === "DELETE") {
        const file = url.searchParams.get("file") || "";
        if (!MEDIA_FILE.test(file)) return json({ error: "Unknown file." }, 400);
        await media().delete(file);
        return json({ ok: true });
      }
      return json({ error: "Method not allowed" }, 405);
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("Site function error:", err);
    if (path === "/" && read) return page(HOME, "text/html; charset=utf-8", "site", false);
    return json({ error: "Something went wrong on the server. Try again in a moment." }, 500);
  }
};

export const config = { path: ["/", "/llms.txt", "/resume", "/media/*", "/api/*"] };
