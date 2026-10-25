# Akhilesh Kumar Bhagat — Portfolio

Plain HTML + CSS + JavaScript, no framework. Everything on the site — text,
projects, images, videos and whole sections — is edited at **/admin**, with a
live preview, and published in one click. A small Netlify function serves the
published version; if anything goes wrong it falls back to the built-in page.

## Editing the site

1. Open https://krakhilesh.netlify.app/admin and enter the admin password.
2. Pick the **Website** or **Résumé** tab and edit on the left; the preview on
   the right updates as you type (Desktop / Phone).
3. Press **Save & publish** (or Ctrl+S). The site shows the new version straight away.

What you can change in the Website tab:

- **Page & search** — page title and the descriptions Google and link previews show.
- **Header, Hero, About** — name, the big hero lines, the about text, what the mascot says.
  `*word*` highlights a word.
- **Project groups** — the tabs above the project grid.
- **Projects** — title, group, summary, YouTube video (normal or Short), a photo
  (upload, or link), tech, pop-up details, links, and **Feature in the scrolling
  tour** (colours, mascot outfit and its two lines).
- **Sections** — Research, Experience and Résumé can be edited, reordered or
  hidden; **New section** adds your own with any mix of text, image and video
  blocks (full width or side by side). In text, a blank line starts a new
  paragraph, `*word*` is bold and `[label](https://link)` is a link.
- **Contact & footer** — heading, email, links, location.

Uploads: photos are resized to 2000 px before upload; GIFs and MP4/WebM videos
up to 5.5 MB go as they are. Put longer videos on YouTube and paste the link.
**Uploads** lists everything uploaded, for reuse or deleting.

**Restore original** loads the starting content back into the editor (nothing
changes on the site until you publish).

**Password:** the `ADMIN_PASSWORD` environment variable in Netlify (Project
configuration → Environment variables). To change it, edit it there and redeploy.

## Files

```
index.html             the page; <!-- build:NAME --> regions are filled from content
admin.html, js/admin/  the editor
js/site-default.mjs    the original website content
js/site-render.mjs     turns content into the page's HTML (shared by the build,
                       the function and the editor preview)
js/resume-default.mjs, js/resume-render.mjs   the same for the résumé
netlify/functions/site.mjs   serves /, /resume, /llms.txt and uploads; saves from /admin
netlify/lib/templates.mjs    index.html as a string for the function (generated)
tools/build.mjs        renders the original content into index.html, llms.txt,
                       sitemap.xml and netlify/lib/templates.mjs
css/style.css          all styling and animation
js/main.js             scroll-driven behaviour: about text, pinned tour, tiles,
                       travelling mascot, pop-up player, contact form
js/mascot3d.js, js/me.js   the 3D mascot and its flat fallback
_headers, _redirects, robots.txt, 404.html   Netlify settings and crawler rules
```

## Changing the code

After editing `index.html`, `js/site-render.mjs` or `js/site-default.mjs`, run:

```bash
node tools/build.mjs
```

Then deploy with the Netlify CLI from this folder, so the function is bundled
(dragging the folder onto **Deploys** would leave out the function, and /admin
and the published edits would stop working):

```bash
npm install
npx netlify-cli deploy --prod --dir <copy of the site without tools/ and netlify/> --functions netlify/functions
```

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
