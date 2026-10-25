# Akhilesh Kumar Bhagat — Portfolio

Plain HTML + CSS + JavaScript. No npm, no build step, no framework.
Three.js is loaded from a CDN only for the 3D mascot.

```
index.html        the page (hero, about, tour, work, research, experience, contact)
css/style.css     all styling and animation
js/data.js        ← EDIT THIS to add/change projects, groups and narration
js/main.js        scroll-driven behaviour: about text, pinned project tour, tiles,
                  travelling mascot, popup player, contact form
tools/build.js    writes the project tiles, structured data, sitemap.xml and
                  llms.txt from data.js (run after editing data.js)
robots.txt        lets search engines and AI assistants crawl everything
sitemap.xml       generated · llms.txt  generated plain-text profile for AI assistants
js/mascot3d.js    the 3D mascot (Three.js + a dither shader): outfits, poses, gestures
js/me.js          fallback "flat" mascot for browsers without WebGL
assets/           favicon, share image (og.jpg), profile photo used by the fallback
404.html          "page not found" page (Netlify uses it automatically)
_headers          security / caching headers for Netlify
```

## Deploy to Netlify

Either connect this GitHub repository in Netlify (Build command: *empty*,
Publish directory: `.`) — every `git push` then redeploys automatically — or drag
this folder onto **Deploys** in your Netlify site.

## Preview locally

Run a tiny local server from this folder (YouTube embeds don't play from `file://`):

```bash
python -m http.server 8080
```

then open <http://localhost:8080>.

## Updating content (`js/data.js`)

- **New project:** copy a `{ ... }` block in `projects` and edit it.
  - `segment` picks its group (`music`, `assistive`, `robotics`, `embedded`, `vision`).
  - `label` is the small text on the right of its tile.
  - `video: { id: "..." }` — YouTube id (after `watch?v=`); for a Short add `short: true`.
  - No video? Leave `video` out and set `signal` to a tiny label like `"IMU → ESP32 → PC"`.
- **Featured (the pinned colour tour at the top):** add a `featured` block:
  `color`, `ink` (text colour on it), `file` (label in the video window),
  `outfit` (`polo`, `tee`, `music`, `polo-music`, `phone`, `vr`) and
  `say` — the two lines the mascot says. Wrap words in `*stars*` to highlight them.
- **Groups:** edit `segments` (title, one-line blurb, what the mascot says).
- **Patents, papers, experience:** edit them directly in `index.html`.

## After editing data.js

Run this once (needs Node.js, no install):

```bash
node tools/build.js
```

It rewrites the project tiles inside `index.html` plus `sitemap.xml` and
`llms.txt`, so search engines and AI assistants see every project as plain
text. Commit the result; Netlify needs no build step.

## The mascot

Built from simple shapes in `js/mascot3d.js` and rendered through a halftone
dither. It looks at the cursor, blinks, breathes, waves, changes outfit per
project, and reacts to clicks — pat its head, poke its belly, click near its
hands for a high five, double-click to make it jump, drag it to make it lean.
Leave it alone for 25 seconds and it falls asleep.

## Motion

Visitors whose system asks for reduced motion get a calmer version (fades
instead of big movement; the mascot still animates). The footer has a
**Motion** toggle to switch; `?motion=full` or `?motion=calm` in the URL does the same.

## Contact form

Uses Web3Forms with the same access key as the old site, so messages go to the
email registered there. Nothing to configure on Netlify.
