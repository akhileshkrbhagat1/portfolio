/* Portfolio behaviour — plain JS. Content: window.SITE (inlined in the page) · 3D mascot: mascot3d.js · photo fallback: me.js */
(function () {
  "use strict";

  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  var SITE = window.SITE || {};
  var projects = SITE.projects || [];
  var root = document.documentElement;
  var reduced = root.classList.contains("motion-calm"); // calm mode: fades instead of big movement
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var bySlug = {};
  projects.forEach(function (p) { bySlug[p.slug] = p; });

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // "*word*" becomes highlighted; every word gets its own span for scrubbing.
  function words(text) {
    return text.split("*").map(function (part, k) {
      var inner = part.split(/(\s+)/).map(function (w) { return /^\s+$/.test(w) || !w ? w : '<span class="w">' + esc(w) + "</span>"; }).join("");
      return k % 2 ? "<em>" + inner + "</em>" : inner;
    }).join("");
  }
  function yt(id, file) { return "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/" + file + ".jpg"; }
  // Upgrade a thumbnail to HD; YouTube serves a tiny placeholder when no HD still exists.
  function poster(img, id) {
    var hd = yt(id, "maxresdefault");
    img.addEventListener("load", function onload() {
      if (img.src !== hd) return;
      img.removeEventListener("load", onload);
      if (img.naturalWidth <= 120) { img.src = yt(id, "hqdefault"); img.classList.add("is-lb"); }
      else img.classList.remove("is-lb");
    });
    img.addEventListener("error", function () { img.src = yt(id, "hqdefault"); img.classList.add("is-lb"); }, { once: true });
    img.src = hd;
  }
  function load(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement("script");
      s.src = src; s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ================= Split headings into words ================= */
  var wi = 0;
  function split(el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="word"><span style="--i:' + (wi++) + '">' + esc(w) + "</span></span>";
    }).join(" ");
  }
  $$(".hero__title > span").forEach(split);
  $$("[data-split]:not(.hero__title)").forEach(function (el) { wi = 0; split(el); });

  /* ================= About: scrubbed words ================= */
  var about = $("#about"), aboutText = $("#aboutText");
  aboutText.innerHTML = words(aboutText.textContent);
  var aboutWords = $$(".w", aboutText);

  /* ================= Tour (pinned featured projects) ================= */
  var featured = projects.filter(function (p) { return p.featured && (p.video || p.image); });
  var N = featured.length;
  var tour = $("#featured"), stage = $("#tourStage"), tourBubble = $("#tourBubble"), tourPill = $("#tourPill");
  tour.style.height = "calc(100svh + " + (N * 140) + "svh)";
  $("#tourBars").innerHTML = featured.map(function () { return "<span><i></i></span>"; }).join("");
  $("#tourTitles").innerHTML = featured.map(function (p) {
    return '<h2 class="tour__title">' + esc(p.title) + "<small>" + esc(p.label) + "</small></h2>";
  }).join("");
  $("#tourScreens").innerHTML = featured.map(function (p) {
    return '<div class="window"><div class="window__bar" aria-hidden="true"><i></i><i></i><i></i><span class="window__file">' + esc(p.featured.file) + "</span></div>" +
      '<div class="window__screen" data-project="' + esc(p.slug) + '" data-cursor="' + (p.video ? "Play" : "Open") + '">' +
      (p.image ? '<img alt="' + esc(p.title) + '" src="' + esc(p.image) + '">' : '<img alt="' + esc(p.title) + ' — video still" data-poster="' + esc(p.video.id) + '">') +
      '<span class="window__cta">' + (p.video ? "▶ Play with sound" : "Open the project") + "</span></div></div>";
  }).join("");
  $$("[data-poster]", tour).forEach(function (img) { poster(img, img.dataset.poster); });
  var bars = $$("#tourBars i"), titles = $$(".tour__title"), windows = $$(".window", tour);

  var liveIdx = -1, liveTimer;
  function goLive(i) {
    if (i === liveIdx) return;
    liveIdx = i;
    clearTimeout(liveTimer);
    $$(".window__screen iframe", tour).forEach(function (f) { f.remove(); });
    if (i < 0 || reduced || saveData || !featured[i].video) return;
    liveTimer = setTimeout(function () {
      var p = featured[i], screen = $(".window__screen", windows[i]);
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + p.video.id + "?autoplay=1&mute=1&loop=1&playlist=" + p.video.id +
        "&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3";
      f.title = p.title + " (muted preview)";
      f.tabIndex = -1;
      f.setAttribute("allow", "autoplay; encrypted-media");
      f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      f.addEventListener("load", function () { setTimeout(function () { f.classList.add("is-live"); }, 900); });
      screen.insertBefore(f, $(".window__cta", screen));
    }, 500);
  }

  /* ================= Work: groups and tiles (static HTML written by tools/build.js) ================= */
  var segNav = $("#segNav"), segEl = $("#segments");
  $$("[data-poster]", segEl).forEach(function (img) { poster(img, img.dataset.poster); });
  var flips = $$("[data-flip]", segEl);

  if (fine && !reduced) {
    flips.forEach(function (media) {
      var img = $("img", media), id = media.dataset.flip, frames = ["hq1", "hq2", "hq3"], timer, k, original;
      media.parentElement.addEventListener("mouseenter", function () {
        original = img.src; k = 0;
        frames.forEach(function (f) { new Image().src = yt(id, f); });
        timer = setInterval(function () { img.src = yt(id, frames[k++ % 3]); img.classList.add("is-lb"); }, 420);
      });
      media.parentElement.addEventListener("mouseleave", function () {
        clearInterval(timer);
        if (original) { img.src = original; img.classList.toggle("is-lb", original.indexOf("hqdefault") > -1); }
      });
    });
  }

  /* ================= Reveals + count-ups ================= */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
  $$(".reveal").forEach(function (el) { revealIO.observe(el); });

  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      if (reduced) return; // the real number is already in the HTML
      var el = en.target, end = +el.dataset.count, suffix = el.dataset.suffix || "", t0 = performance.now();
      (function step(now) {
        var t = Math.min(1, (now - t0) / 1400);
        el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))) + (t === 1 ? suffix : "");
        if (t < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(function (el) { countIO.observe(el); });

  /* ================= The mascot: 3D if possible, photo fallback otherwise ================= */
  var Fx = window.MeFx;
  var floatMe = $("#heroMe"), endMe = $("#endMe"), guideMe = $("#guideMe");
  var guide = $("#guide"), guideBubble = $("#guideBubble"), heroBubble = $("#heroBubble");
  var noop = function () {};
  var ME = { wear: noop, next: noop, wave: noop, sleep: noop, react: function () { return "poke"; }, grab: noop, hover: noop, jump: noop, point: noop, cheer: noop };

  function photoMascot() {
    var Me = window.Me, map = { polo: 1 };
    Me.init();
    return {
      wear: function (name) { return Me.wear(typeof name === "number" ? name : (map[name] || 0)); },
      next: function () { return Me.next(); },
      wave: noop, sleep: noop, grab: noop, hover: noop, jump: noop, point: noop, cheer: noop,
      react: function () { Me.next(); return "poke"; }
    };
  }
  var mascotReady = load(THREE_URL).then(function () { return load("js/mascot3d.js"); }).then(function () {
    if (!window.Mascot3D || !window.Mascot3D.supported()) throw new Error("no webgl");
    window.Mascot3D.init();
    return window.Mascot3D;
  });
  mascotReady = Promise.race([mascotReady, new Promise(function (_, no) { setTimeout(no, 8000); })])
    .catch(function () { return photoMascot(); })
    .then(function (m) { ME = m; ME.wear("polo"); return m; });

  var QUIPS = ["Hey! That tickles.", "Careful — I'm holding a soldering iron.", "I debug with an oscilloscope, not a debugger.", "Did you watch the Tabla Glove one?", "Click me again, I dare you."];
  var PATS = ["Hehe — thanks for the pat!", "That's nice. Keep scrolling, though.", "Aww."];
  var FIVES = ["Up top! ✋", "Nice one!", "High five — now go watch a demo."];
  var fiveN = 0;
  var quipN = 0, patN = 0, quipTimer;

  var currentSay = "";
  function guideSay(text, force) {
    if (!text || (text === currentSay && !force)) return;
    currentSay = text;
    guideBubble.classList.remove("is-swap"); void guideBubble.offsetWidth; guideBubble.classList.add("is-swap");
    Fx.say(guideBubble, text);
  }
  function speak(where, line) {
    clearTimeout(quipTimer);
    if (where === "hero") {
      Fx.say(heroBubble, line);
      quipTimer = setTimeout(function () { Fx.say(heroBubble, $(".hero").dataset.say); }, 3200);
    } else if (where === "tour") {
      setTourLine(line, true);
      quipTimer = setTimeout(function () { tourKey = ""; onScroll(); }, 3200);
    } else {
      var back = currentSay;
      guideSay(line, true);
      quipTimer = setTimeout(function () { guideSay(back, true); }, 3200);
    }
  }
  function bindMascot(btn, where) {
    btn.addEventListener("pointerdown", function (e) { ME.grab(e.clientX); });
    btn.addEventListener("pointerenter", function () { ME.hover(true); });
    btn.addEventListener("pointerleave", function () { ME.hover(false); });
    btn.addEventListener("dblclick", function () { ME.jump(); speak(typeof where === "function" ? where() : where, "Wheee!"); });
    btn.addEventListener("click", function (e) {
      var r = btn.getBoundingClientRect();
      var kind = ME.react(clamp((e.clientY - r.top) / r.height, 0, 1));
      var line = kind === "pat" ? PATS[patN++ % PATS.length] : kind === "highfive" ? FIVES[fiveN++ % FIVES.length] : QUIPS[quipN++ % QUIPS.length];
      speak(typeof where === "function" ? where() : where, line);
    });
  }
  bindMascot(floatMe, function () { return inTour ? "tour" : "hero"; });
  bindMascot(guideMe, "guide");
  bindMascot(endMe, "guide");
  var motionBtn = $("#motionToggle");
  motionBtn.textContent = reduced ? "Motion: calm — turn on" : "Motion: full — calm it down";
  motionBtn.addEventListener("click", function () {
    try { localStorage.setItem("motion", reduced ? "full" : "calm"); } catch (e) {}
    location.reload();
  });
  $("#dressUp").addEventListener("click", function () { ME.next(); speak("guide", "How's this one?"); });

  // The badge comments on whatever project tile you hover.
  $$(".tile").forEach(function (tile) {
    var p = bySlug[tile.dataset.project];
    tile.addEventListener("mouseenter", function () {
      if (!afterTour || endVisible) return;
      clearTimeout(quipTimer);
      var back = currentSay;
      guideSay("*" + p.title + "* — " + (p.video ? "click to watch it." : "click for the details."), true);
      tile.addEventListener("mouseleave", function leave() {
        tile.removeEventListener("mouseleave", leave);
        quipTimer = setTimeout(function () { guideSay(back, true); }, 600);
      });
    });
  });
  $$(".end__mail, .end__links a").forEach(function (a) { a.addEventListener("mouseenter", function () { ME.cheer(); }); });

  Fx.idle(function () {
    ME.sleep(true);
    Fx.say(heroBubble, "zZz… scroll to wake me up.");
    guideSay("zZz… scroll to wake me up.", true);
  }, function () {
    ME.sleep(false);
    Fx.say(heroBubble, "Oh! I'm awake.");
    guideSay("Oh! I'm awake. Where were we?", true);
    setTimeout(function () { Fx.say(heroBubble, $(".hero").dataset.say); }, 2500);
  });

  // Sections below the tour talk through the corner badge.
  var sayIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      guideSay(en.target.dataset.say);
      if (en.target.dataset.outfit && afterTour) ME.wear(en.target.dataset.outfit);
      var seg = en.target.id.indexOf("seg-") === 0 ? en.target.id.slice(4) : null;
      $$("a", segNav).forEach(function (a) { a.classList.toggle("is-active", a.dataset.seg === seg); });
      if (seg) { var a = $('a[data-seg="' + seg + '"]', segNav); if (a) segNav.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" }); }
    });
  }, { rootMargin: "-48% 0px -48% 0px" });
  $$(".seg, .proof[data-say]").forEach(function (el) { sayIO.observe(el); });

  var endVisible = false;
  new IntersectionObserver(function (e) {
    endVisible = e[0].isIntersecting;
    endMe.classList.toggle("is-up", endVisible);
    if (endVisible) { ME.wear("polo"); ME.wave(); }
    onScroll();
  }, { threshold: 0.12 }).observe($("#contact"));

  /* ================= One scroll loop drives everything ================= */
  var tourKey = "", tourIdx = -1, inTour = false, afterTour = false, ticking = false;
  var heroCopy = $(".hero__copy"), hero = $("#hero");

  function setTourLine(text, instant) {
    tourBubble.classList.remove("is-swap"); void tourBubble.offsetWidth; tourBubble.classList.add("is-swap");
    $(".bubble__txt", tourBubble).innerHTML = words(text);
    if (instant) $$(".w", tourBubble).forEach(function (w) { w.classList.add("is-on"); });
  }

  function onScroll() {
    ticking = false;
    var vh = innerHeight, vw = root.clientWidth, y = window.scrollY;
    var heroH = hero.offsetHeight;

    // Hero copy drifts up and fades
    if (!reduced) {
      var hp = clamp(y / heroH, 0, 1);
      heroCopy.style.transform = "translateY(" + (y * -0.18).toFixed(1) + "px)";
      heroCopy.style.opacity = (1 - hp * 1.3).toFixed(3);
    }

    // About words fill in
    var ar = about.getBoundingClientRect();
    var ap = clamp((vh * 0.55 - ar.top) / (ar.height - vh * 0.55), 0, 1);
    var on = Math.round(ap * aboutWords.length * 1.04);
    aboutWords.forEach(function (w, i) { w.classList.toggle("is-on", i < on); });

    // Tour progress (skipped when nothing is featured: the section is hidden)
    var tr = tour.getBoundingClientRect();
    if (!N) { inTour = false; afterTour = true; } else {
    var t = clamp(-tr.top / (tr.height - vh), 0, 1);
    var pos = t * N, idx = Math.min(N - 1, Math.floor(pos)), local = pos - idx;
    inTour = tr.top <= vh * 0.35 && tr.bottom >= vh * 0.6;
    afterTour = tr.bottom < vh * 0.6;
    bars.forEach(function (b, i) { b.style.transform = "scaleX(" + clamp(pos - i, 0, 1).toFixed(3) + ")"; });
    titles.forEach(function (el, i) { el.classList.toggle("is-active", i === idx); el.classList.toggle("is-past", i < idx); });
    windows.forEach(function (el, i) { el.classList.toggle("is-active", i === idx); el.classList.toggle("is-past", i < idx); });
    var img = $("img", windows[idx]);
    if (img && !reduced) img.style.setProperty("--zoom", (1 + local * 0.07).toFixed(4));

    if (idx !== tourIdx) {
      tourIdx = idx;
      var f = featured[idx].featured;
      stage.style.setProperty("--bg", f.color);
      stage.style.setProperty("--fg", f.ink);
      tourPill.dataset.project = featured[idx].slug;
    }
    var beat = local < 0.5 ? 0 : 1;
    var key = idx + ":" + beat;
    if (key !== tourKey) { tourKey = key; setTourLine(featured[idx].featured.say[beat]); }
    var bp = clamp(((local - beat * 0.5) / 0.5) / 0.55, 0, 1);
    var tw = $$(".w", tourBubble), lit = Math.ceil(bp * tw.length);
    tw.forEach(function (w, i) { w.classList.toggle("is-on", i < lit); });
    goLive(inTour ? idx : -1);
    ME.point(inTour && beat === 1);
    }

    // The travelling mascot: hero centre → bottom-left for the tour → hands over to the badge
    var mw = floatMe.offsetWidth, mh = mw * 1.17;
    var ms = parseFloat(getComputedStyle(root).getPropertyValue("--ms")) || 0.62;
    var wrapEl = $(".wrap"), gutter = wrapEl.getBoundingClientRect().left + (parseFloat(getComputedStyle(wrapEl).paddingLeft) || 24);
    root.style.setProperty("--mx", gutter.toFixed(1) + "px");
    var k = clamp(y / (heroH + about.offsetHeight * 0.45), 0, 1);
    k = k * k * (3 - 2 * k);
    var s = 1 + (ms - 1) * k;
    var x = (vw - mw) / 2 + ((gutter - mw * (1 - ms) / 2) - (vw - mw) / 2) * k;
    var dy = mh * (0.05 + 0.02 * k);
    floatMe.style.translate = x.toFixed(1) + "px " + dy.toFixed(1) + "px";
    floatMe.style.scale = s.toFixed(4);
    var showFloat = root.classList.contains("is-ready") && !afterTour && !endVisible;
    floatMe.classList.toggle("is-on", showFloat);
    floatMe.classList.toggle("is-gone", !showFloat);

    // Outfit follows the story
    if (inTour) ME.wear(featured[idx].featured.outfit || "polo");
    else if (!afterTour && !endVisible) ME.wear("polo");

    // Header text colour follows whatever is underneath it
    var fg = "#121212", cr = $("#contact").getBoundingClientRect();
    if (hero.getBoundingClientRect().bottom > 40 || cr.top < 40) fg = "#fbfbf8";
    else if (N && tr.top <= 40 && tr.bottom > 40) fg = featured[tourIdx].featured.ink;
    root.style.setProperty("--top-fg", fg);

    // Corner badge takes over after the tour (not in the footer)
    guide.classList.toggle("is-on", afterTour && !endVisible);

    // Tile images drift a little (parallax)
    if (!reduced) flips.forEach(function (m) {
      var r = m.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      m.style.setProperty("--py", (((r.top + r.height / 2) - vh / 2) / vh * -36).toFixed(1) + "px");
    });
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  /* ================= Cursor + magnetic buttons ================= */
  if (fine && !reduced) {
    var cursor = $("#cursor"), label = $("span", cursor), cx = -200, cy = -200, px = -200, py = -200;
    window.addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; }, { passive: true });
    (function loop() {
      cx += (px - cx) * 0.22; cy += (py - cy) * 0.22;
      cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", function (e) {
      var el = e.target.closest("[data-cursor]");
      cursor.classList.toggle("is-on", !!el);
      if (el) label.textContent = el.dataset.cursor;
    });
    $$(".magnetic").forEach(function (m) {
      m.addEventListener("pointermove", function (e) {
        var r = m.getBoundingClientRect();
        m.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + "px)";
      });
      m.addEventListener("pointerleave", function () { m.style.transform = ""; });
    });
  }

  /* ================= Project modal ================= */
  var modal = $("#modal"), media = $("#modalMedia"), body = $("#modalBody"), file = $("#modalFile");
  function openProject(slug) {
    var p = bySlug[slug];
    if (!p) return;
    goLive(-1); liveIdx = -2;
    file.textContent = (p.featured && p.featured.file) || slug.replace(/-/g, "_") + (p.video ? ".mp4" : ".md");
    media.innerHTML = p.video ?
      '<div class="frame' + (p.video.short ? " frame--short" : "") + '"><iframe src="https://www.youtube-nocookie.com/embed/' + p.video.id +
      '?autoplay=1&rel=0&playsinline=1&modestbranding=1" title="' + esc(p.title) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>' :
      p.image ? '<img class="modal__img" src="' + esc(p.image) + '" alt="' + esc(p.title) + '">' : "";
    body.innerHTML =
      '<p class="modal__label">' + esc(p.label || "") + "</p>" +
      '<h3 id="modalTitle">' + esc(p.title) + "</h3>" +
      "<p>" + esc(p.summary) + "</p>" +
      (p.details ? "<ul>" + p.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="modal__tags">' + p.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
      (p.links ? '<div class="modal__links">' + p.links.map(function (l) {
        return '<a class="pill" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + ' <span aria-hidden="true">↗</span></a>';
      }).join("") + "</div>" : "");
    if (typeof modal.showModal === "function") modal.showModal(); else modal.setAttribute("open", "");
    root.style.overflow = "hidden";
  }
  function closeModal() { if (modal.open && modal.close) modal.close(); else modal.removeAttribute("open"); }
  modal.addEventListener("close", function () { media.innerHTML = ""; root.style.overflow = ""; liveIdx = -1; onScroll(); });
  $("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("click", function (e) {
    if (e.target.closest("a")) return; // real links inside a tile just navigate
    var el = e.target.closest("[data-project]");
    if (el) openProject(el.dataset.project);
  });

  /* ================= Contact form (Web3Forms) ================= */
  var form = $("#contactForm"), status = $("#formStatus");
  function setStatus(msg, kind) { status.textContent = msg; status.className = "form__status" + (kind ? " " + kind : ""); }
  if (/[?&]sent=1/.test(location.search)) {
    $(".end__form").open = true;
    setStatus("Sent — thanks! I'll reply soon.");
    try { history.replaceState(null, "", location.pathname + "#contact"); } catch (e) {}
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]'), fd = new FormData(form);
    fd.delete("redirect");
    btn.disabled = true;
    setStatus("Sending…");
    fetch(form.action, { method: "POST", headers: { Accept: "application/json" }, body: fd })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.success) throw new Error(j.message); form.reset(); setStatus("Sent — thanks! I'll reply soon."); })
      .catch(function () { setStatus("Couldn't send. Please email akhileshkrbhagat1@gmail.com instead.", "err"); })
      .then(function () { btn.disabled = false; });
  });

  /* ================= Résumé preview: the live page, scaled down to its frame ================= */
  var resumeFrame = $(".resume__frame");
  if (resumeFrame && window.ResizeObserver) {
    new ResizeObserver(function () { resumeFrame.style.setProperty("--k", (resumeFrame.clientWidth / 860).toFixed(4)); }).observe(resumeFrame);
  }

  /* ================= Go ================= */
  function ready() {
    root.classList.add("is-ready");
    onScroll();
    setTimeout(function () { Fx.say(heroBubble, $(".hero").dataset.say); }, reduced ? 0 : 1300);
    mascotReady.then(function () { setTimeout(function () { ME.wave(); }, 900); });
  }
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(ready);
  else ready();
})();
