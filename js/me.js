/*
 * The pixel "me" — draws photos of Akhilesh as a dithered (halftone) character.
 *
 * Looks ("outfits") are cut-out PNGs with transparent backgrounds, all aligned on
 * the face (see README). If none exist yet, the round profile photo is used.
 * Everything renders on small canvases scaled up with crisp pixels.
 */
(function () {
  "use strict";

  var LOOKS = ["assets/me-front.png", "assets/me-polo.png"];
  var FALLBACK = "assets/profile.jpg";
  var W = 180, H = 210;
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var INK = [18, 18, 18], PAPER = [255, 255, 255];
  var reduced = false; // small, contained motion: kept even in calm mode

  // Fixed random order per pixel, used for the dissolve between looks.
  var noise = new Float32Array(W * H);
  for (var n = 0; n < noise.length; n++) noise[n] = Math.random();

  function load(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Turn an image into per-pixel tone (0 dark .. 1 light), a silhouette mask and its outline.
  function analyse(img, round) {
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var x = c.getContext("2d", { willReadFrequently: true });
    if (round) {
      var s = W * 0.98, ox = (W - s) / 2, oy = H - s - 4;
      x.save(); x.beginPath(); x.arc(W / 2, oy + s / 2, s * 0.465, 0, Math.PI * 2); x.clip();
      x.drawImage(img, ox, oy, s, s); x.restore();
    } else {
      x.drawImage(img, 0, 0, W, H);
    }
    var d = x.getImageData(0, 0, W, H).data;
    var lum = new Float32Array(W * H), on = new Uint8Array(W * H), vals = [];
    for (var i = 0; i < W * H; i++) {
      if (d[i * 4 + 3] > 140) {
        on[i] = 1;
        lum[i] = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
        vals.push(lum[i]);
      }
    }
    vals.sort(function (a, b) { return a - b; });
    var lo = vals[Math.floor(vals.length * 0.03)] || 0, hi = vals[Math.floor(vals.length * 0.97)] || 1;
    for (i = 0; i < W * H; i++) {
      if (on[i]) lum[i] = Math.pow(Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(hi - lo, 0.001))), 0.62);
    }
    var edge = new Uint8Array(W * H);
    for (var y = 0; y < H; y++) {
      for (var xx = 0; xx < W; xx++) {
        i = y * W + xx;
        if (on[i] && (xx === 0 || !on[i - 1] || xx === W - 1 || !on[i + 1] || y === 0 || !on[i - W] || y === H - 1 || !on[i + W])) edge[i] = 1;
      }
    }
    return { lum: lum, on: on, edge: edge };
  }

  var Me = {
    looks: [],
    current: 0,
    views: [],
    frame: null,
    buffer: null,
    ready: null,

    // Draw look `a`, dissolving into look `b` by amount t (0..1). Either may be null (empty).
    paint: function (a, b, t) {
      var p = this.frame.data;
      for (var i = 0; i < W * H; i++) {
        var src = noise[i] < t ? b : a;
        var o = i * 4;
        if (!src || !src.on[i]) { p[o + 3] = 0; continue; }
        var r = (BAYER[((i / W | 0) & 3) * 4 + (i % W & 3)] + 0.5) / 16;
        var ink = src.edge[i] || src.lum[i] <= r;
        var col = ink ? INK : PAPER;
        p[o] = col[0]; p[o + 1] = col[1]; p[o + 2] = col[2]; p[o + 3] = 255;
      }
      this.buffer.getContext("2d").putImageData(this.frame, 0, 0);
      for (var v = 0; v < this.views.length; v++) {
        var ctx = this.views[v];
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(this.buffer, 0, 0);
      }
    },

    // Animate from one look to another (null = nothing, used for the intro).
    dissolve: function (fromLook, toLook, ms) {
      var self = this;
      if (reduced || !ms) { self.paint(toLook, null, 0); return Promise.resolve(); }
      return new Promise(function (resolve) {
        var start = performance.now();
        (function step(now) {
          var t = Math.min(1, (now - start) / ms);
          self.paint(fromLook, toLook, t * t * (3 - 2 * t));
          if (t < 1) requestAnimationFrame(step); else resolve();
        })(start);
      });
    },

    wear: function (index) {
      if (this.looks.length < 2) return Promise.resolve();
      index = ((index % this.looks.length) + this.looks.length) % this.looks.length;
      if (index === this.current) return Promise.resolve();
      var from = this.looks[this.current];
      this.current = index;
      return this.dissolve(from, this.looks[index], 650);
    },

    next: function () { return this.wear(this.current + 1); },

    attach: function (canvas) {
      canvas.width = W; canvas.height = H;
      var ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      this.views.push(ctx);
      if (this.looks.length) ctx.drawImage(this.buffer, 0, 0);
    },

    init: function () {
      var self = this;
      this.buffer = document.createElement("canvas");
      this.buffer.width = W; this.buffer.height = H;
      this.frame = this.buffer.getContext("2d").createImageData(W, H);
      document.querySelectorAll(".me canvas").forEach(function (c) { self.attach(c); });

      this.ready = Promise.all(LOOKS.map(function (src) {
        return load(src).then(function (img) { return analyse(img, false); }, function () { return null; });
      })).then(function (looks) {
        looks = looks.filter(Boolean);
        if (looks.length) return looks;
        return load(FALLBACK).then(function (img) { return [analyse(img, true)]; });
      }).then(function (looks) {
        self.looks = looks;
        return self.dissolve(null, looks[0], 1100); // materialise
      }).catch(function () { /* no image at all: leave the canvases empty */ });
      return this.ready;
    }
  };

  /* ---------- Behaviour shared by every character on the page ---------- */

  var QUIPS = [
    "Hey! That tickles.",
    "Careful — I'm holding a soldering iron.",
    "New outfit. Better?",
    "Did you watch the Tabla Glove one?",
    "I debug with an oscilloscope, not a debugger.",
    "Click me again, I dare you."
  ];
  var quip = 0;

  function poke(btn) {
    btn.classList.remove("is-poked");
    void btn.offsetWidth; // restart the animation
    btn.classList.add("is-poked");
    Me.next();
    return QUIPS[quip++ % QUIPS.length];
  }

  // Lean toward the pointer.
  function tilt(btn) {
    if (reduced || !window.matchMedia("(hover: hover)").matches) return;
    var rx = 0, ry = 0, tx = 0, ty = 0, raf = 0;
    window.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop() {
      rx += (ty - rx) * 0.12; ry += (tx - ry) * 0.12;
      btn.style.transform = "perspective(700px) rotateX(" + (-rx * 7).toFixed(2) + "deg) rotateY(" + (ry * 12).toFixed(2) + "deg)";
      raf = Math.abs(ty - rx) + Math.abs(tx - ry) > 0.002 ? requestAnimationFrame(loop) : 0;
    }
  }

  // Doze off after a while without input; wake on any activity.
  function idle(onSleep, onWake) {
    var timer, asleep = false;
    function reset() {
      if (asleep) { asleep = false; document.querySelectorAll(".me").forEach(function (m) { m.classList.remove("is-dozing"); }); onWake(); }
      clearTimeout(timer);
      timer = setTimeout(function () {
        asleep = true;
        document.querySelectorAll(".me").forEach(function (m) { m.classList.add("is-dozing"); });
        onSleep();
      }, 25000);
    }
    ["pointermove", "scroll", "keydown", "touchstart", "wheel"].forEach(function (ev) {
      window.addEventListener(ev, reset, { passive: true });
    });
    reset();
  }

  /* ---------- Speech bubbles: *word* is highlighted, text types itself out ---------- */
  function say(bubble, text, instant) {
    if (!bubble || bubble.dataset.text === text) return;
    bubble.dataset.text = text;
    var el = bubble.querySelector(".bubble__txt") || bubble;
    var parts = text.split("*"), html = "", chars = 0;
    parts.forEach(function (part, k) {
      var inner = part.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; })
        .replace(/[^\s]|\s/g, function (c) { chars++; return '<span class="ch">' + c + "</span>"; });
      html += k % 2 ? "<em>" + inner + "</em>" : inner;
    });
    el.innerHTML = html;
    var spans = el.querySelectorAll(".ch");
    if (reduced || instant) return;
    spans.forEach(function (s) { s.style.opacity = 0; });
    var i = 0;
    clearInterval(el._typing);
    el._typing = setInterval(function () {
      for (var k = 0; k < 2 && i < spans.length; k++, i++) spans[i].style.opacity = 1;
      if (i >= spans.length) clearInterval(el._typing);
    }, 16);
  }

  window.Me = Me;
  window.MeFx = { poke: poke, tilt: tilt, idle: idle, say: say };
})();
