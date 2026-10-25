/*
 * 3D mascot of Akhilesh, rendered as a dithered (halftone) character.
 *
 * One small WebGL renderer draws the scene, a dither shader turns it into
 * ink/paper dots, and every ".me canvas" on the page copies that frame — so the
 * hero, the corner badge and the footer all show the same live mascot.
 *
 * Built from primitives (no model files), modelled on his photos: short dark
 * hair with a quiff, blue polo or dark tee, round glasses. Two jointed arms with
 * hands drive poses (per project) and gestures (wave, high-five, jump…).
 *
 * Needs THREE r128 (loaded from cdnjs by main.js). Without WebGL, main.js falls
 * back to the flat photo character in me.js.
 */
(function () {
  "use strict";

  var W = 200, H = 234;
  var T = window.THREE;
  var reduced = false; // the mascot is small and contained, so it animates in every mode
  var calm = document.documentElement.classList.contains("motion-calm");
  var now = function () { return performance.now() / 1000; };

  function webgl() {
    try {
      var c = document.createElement("canvas");
      return !!(T && window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }

  /* Outfits: clothes + props, and the pose the arms take while wearing them */
  var OUTFITS = {
    polo:         { shirt: "polo", pose: "rest" },
    tee:          { shirt: "tee", glasses: true, pose: "rest" },
    music:        { shirt: "tee", glasses: true, phones: true, pose: "tabla" },
    "polo-music": { shirt: "polo", phones: true, pose: "rings" },
    phone:        { shirt: "tee", glasses: true, phone: true, pose: "phone" },
    vr:           { shirt: "tee", vr: true, pose: "vr" }
  };
  var ORDER = ["polo", "tee", "music", "vr", "phone", "polo-music"];

  /* Arm poses for the right arm: [shoulder z (out/up), shoulder x (− = forward), elbow x (− = bend forward), elbow z]
     The left arm mirrors the z angles. */
  var REST = [0.16, -0.38, -1.25, 0];
  var POSES = {
    rest:      { R: REST, L: REST },
    tabla:     { R: [0.32, -0.95, -0.95, 0], L: [0.32, -0.95, -0.95, 0] },
    rings:     { R: [0.5, -1.05, -0.55, 0.2], L: [0.5, -1.05, -0.55, 0.2] },
    phone:     { R: [0.42, -0.95, -1.6, -0.25], L: REST },
    vr:        { R: [2.6, -0.45, -0.3, 1.15], L: [2.6, -0.45, -0.3, 1.15] },
    point:     { R: [1.95, -0.35, -0.12, 0.15], L: REST },
    sleep:     { R: [0.08, -0.15, -0.6, 0], L: [0.08, -0.15, -0.6, 0] },
    wave:      { R: [2.75, -0.15, -0.35, 0], L: REST },
    highfive:  { R: [1.55, -0.95, -0.25, 0], L: REST },
    celebrate: { R: [2.65, -0.1, -0.3, 0], L: [2.65, -0.1, -0.3, 0] },
    stretch:   { R: [2.95, 0, -0.05, 0], L: [2.95, 0, -0.05, 0] },
    pat:       { R: [0.5, -0.65, -1.7, -0.2], L: [0.5, -0.65, -1.7, -0.2] }
  };

  var renderer, scene, camera, rt, post, postScene, postCam;
  var views = [];
  var P = {};
  var S = {
    outfit: "polo", pending: null, spin: -1,
    look: { x: 0, y: 0 }, aim: { x: 0, y: 0 },
    blinkAt: 2, blinkT: -1,
    sleep: 0, sleepTo: 0, happy: 0, oof: 0, hover: 0, hoverSince: -1,
    squash: 0, squashV: 0, lean: 0, leanV: 0, drag: null,
    jump: -1, point: false,
    gesture: null,
    arms: { R: REST.slice(), L: REST.slice() },
    scrollY: window.scrollY, vel: 0
  };

  /* ---------------- Build ---------------- */
  var M;
  function lambert(hex) { return new T.MeshLambertMaterial({ color: hex }); }
  function mesh(geo, mat, parent, pos, scale, rot) {
    var m = new T.Mesh(geo, mat);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (scale) m.scale.set(scale[0], scale[1], scale[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    parent.add(m);
    return m;
  }
  function group(parent, pos) {
    var g = new T.Group();
    if (pos) g.position.set(pos[0], pos[1], pos[2]);
    parent.add(g);
    return g;
  }

  function buildArm(side) {
    var s = side === "R" ? 1 : -1;
    var shoulder = group(P.body, [1.12 * s, 0.5, 0.02]);
    var upper = group(shoulder);
    var cap = mesh(new T.SphereGeometry(0.27, 18, 14), M.polo, upper);
    var sleevePolo = mesh(new T.CylinderGeometry(0.27, 0.25, 0.5, 18), M.polo, upper, [0, -0.22, 0]);
    var sleeveTee = mesh(new T.CylinderGeometry(0.27, 0.25, 0.5, 18), M.tee, upper, [0, -0.22, 0]);
    mesh(new T.CylinderGeometry(0.17, 0.155, 0.5, 16), M.skin, upper, [0, -0.6, 0]);
    var elbow = group(upper, [0, -0.82, 0]);
    mesh(new T.SphereGeometry(0.16, 14, 12), M.skin, elbow);
    mesh(new T.CylinderGeometry(0.155, 0.14, 0.62, 16), M.skin, elbow, [0, -0.32, 0]);
    var hand = group(elbow, [0, -0.72, 0]);
    mesh(new T.SphereGeometry(0.2, 18, 14), M.skin, hand, [0, 0, 0], [0.95, 1.15, 0.72]);                          // palm
    mesh(new T.SphereGeometry(0.075, 12, 10), M.skin, hand, [-0.17 * s, 0.04, 0.06], [1, 1.5, 1], [0, 0, 0.5 * s]); // thumb
    var finger = new T.CylinderGeometry(0.045, 0.04, 0.16, 8);
    [-0.1, -0.035, 0.035, 0.1].forEach(function (x) { mesh(finger, M.skin, hand, [x, -0.22, 0.01]); });
    var phone = null;
    if (side === "R") {
      phone = mesh(new T.BoxGeometry(0.36, 0.62, 0.05), M.device, hand, [0, -0.1, 0.17]);
      mesh(new T.PlaneGeometry(0.3, 0.52), M.screen, phone, [0, 0, 0.03]);
    }
    return { shoulder: shoulder, upper: upper, elbow: elbow, hand: hand, cap: cap, sleevePolo: sleevePolo, sleeveTee: sleeveTee, phone: phone };
  }

  function build() {
    M = {
      skin: lambert(0xd8cbbd), hair: lambert(0x141414), dark: lambert(0x0c0c0c),
      white: new T.MeshBasicMaterial({ color: 0xffffff }),
      polo: lambert(0x8d9bb8), tee: lambert(0x2b2d33), trim: lambert(0xe9e9e9),
      frame: lambert(0x161616), phones: lambert(0x303030), cup: lambert(0x9a9a9a),
      vr: lambert(0xf2f2f2), visor: lambert(0x1a1a1a), device: lambert(0x222222), screen: lambert(0xf7f7f7)
    };
    var sphere = new T.SphereGeometry(1, 40, 30);

    var root = P.root = group(scene);
    var body = P.body = group(root, [0, -1.74, 0]);

    // Torso: lathe-turned bust with sloped shoulders, flattened front-to-back
    var bust = new T.LatheGeometry([
      new T.Vector2(0.001, 0.96), new T.Vector2(0.34, 0.95), new T.Vector2(0.62, 0.88), new T.Vector2(1.02, 0.7),
      new T.Vector2(1.3, 0.42), new T.Vector2(1.4, 0.0), new T.Vector2(1.42, -0.6), new T.Vector2(1.44, -1.6)
    ], 48);
    P.torsoPolo = mesh(bust, M.polo, body, [0, 0, 0], [1, 1, 0.62]);
    P.torsoTee = mesh(bust, M.tee, body, [0, 0, 0], [1, 1, 0.62]);
    mesh(new T.CylinderGeometry(0.27, 0.32, 0.6, 24), M.skin, body, [0, 1.12, 0]);

    var polo = P.polo = group(body);
    var collar = new T.BoxGeometry(0.46, 0.2, 0.06);
    mesh(collar, M.trim, polo, [-0.25, 0.95, 0.3], null, [0.5, 0.25, 0.55]);
    mesh(collar, M.trim, polo, [0.25, 0.95, 0.3], null, [0.5, -0.25, -0.55]);
    mesh(new T.BoxGeometry(0.16, 0.46, 0.05), M.polo, polo, [0, 0.66, 0.6], null, [-0.5, 0, 0]);
    var btn = new T.SphereGeometry(0.045, 12, 10);
    mesh(btn, M.trim, polo, [0, 0.74, 0.6]);
    mesh(btn, M.trim, polo, [0, 0.54, 0.7]);
    mesh(new T.SphereGeometry(0.12, 16, 12), M.trim, polo, [0.62, 0.36, 0.72], [1, 1, 0.35]);

    var tee = P.tee = group(body);
    mesh(new T.TorusGeometry(0.34, 0.06, 10, 32), M.trim, tee, [0, 0.96, 0.06], [1, 1, 1], [1.4, 0, 0]);

    P.R = buildArm("R");
    P.L = buildArm("L");

    // Head on a neck pivot
    var neck = P.neck = group(root, [0, -0.38, 0]);
    var head = P.head = group(neck, [0, 0.74, 0]);
    head.scale.setScalar(1.1);
    mesh(sphere, M.skin, head, [0, 0, 0], [0.92, 1.0, 0.9]);
    mesh(sphere, M.skin, head, [-0.9, -0.02, -0.02], [0.17, 0.26, 0.12]);
    mesh(sphere, M.skin, head, [0.9, -0.02, -0.02], [0.17, 0.26, 0.12]);

    var hair = P.hair = group(head);
    mesh(new T.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), M.hair, hair, [0, 0.12, -0.04], [0.97, 0.98, 0.95], [-0.32, 0, 0]);
    mesh(sphere, M.hair, hair, [0, 0.08, -0.32], [0.9, 0.86, 0.66]);
    mesh(sphere, M.hair, hair, [-0.72, 0.22, 0.02], [0.24, 0.42, 0.5]);
    mesh(sphere, M.hair, hair, [0.72, 0.22, 0.02], [0.24, 0.42, 0.5]);
    P.quiff = mesh(sphere, M.hair, hair, [0.08, 0.86, 0.42], [0.62, 0.26, 0.42], [0.35, 0, -0.18]);
    mesh(sphere, M.hair, hair, [-0.3, 0.74, 0.58], [0.42, 0.16, 0.26], [0.6, 0, 0.3]);

    var face = P.face = group(head);
    var eye = new T.SphereGeometry(0.115, 20, 16);
    P.eyes = [-0.32, 0.32].map(function (x) {
      var e = group(face, [x, 0.06, 0.82]);
      mesh(eye, M.dark, e, [0, 0, 0], [0.9, 1.15, 0.5]);
      mesh(new T.SphereGeometry(0.035, 10, 8), M.white, e, [0.035, 0.05, 0.05]);
      return e;
    });
    P.shut = [-0.32, 0.32].map(function (x) {
      var s = mesh(new T.TorusGeometry(0.1, 0.022, 8, 16, Math.PI), M.dark, face, [x, 0.03, 0.86], [1, 0.8, 1]);
      s.visible = false;
      return s;
    });
    P.brows = [
      mesh(new T.BoxGeometry(0.28, 0.055, 0.05), M.hair, face, [-0.33, 0.32, 0.84], null, [0, 0, 0.1]),
      mesh(new T.BoxGeometry(0.28, 0.055, 0.05), M.hair, face, [0.33, 0.32, 0.84], null, [0, 0, -0.1])
    ];
    mesh(sphere, M.skin, face, [0, -0.13, 0.9], [0.11, 0.14, 0.1]);
    P.smile = mesh(new T.TorusGeometry(0.16, 0.028, 8, 20, Math.PI), M.dark, face, [0, -0.36, 0.8], [1, 0.75, 1], [0, 0, Math.PI]);
    P.mouthO = mesh(new T.SphereGeometry(0.07, 12, 10), M.dark, face, [0, -0.38, 0.82], [1, 1.2, 0.5]);
    P.blush = [-0.5, 0.5].map(function (x) { var b = mesh(new T.SphereGeometry(0.1, 12, 10), M.cup, face, [x, -0.18, 0.72], [1, 0.6, 0.3]); b.visible = false; return b; });

    var glasses = P.glasses = group(face, [0, 0.06, 0.9]);
    var ring = new T.TorusGeometry(0.22, 0.032, 10, 30);
    mesh(ring, M.frame, glasses, [-0.32, 0, 0]);
    mesh(ring, M.frame, glasses, [0.32, 0, 0]);
    mesh(new T.CylinderGeometry(0.022, 0.022, 0.22, 8), M.frame, glasses, [0, 0.03, 0.02], null, [0, 0, Math.PI / 2]);
    mesh(new T.BoxGeometry(0.03, 0.03, 0.75), M.frame, glasses, [-0.56, 0.02, -0.38]);
    mesh(new T.BoxGeometry(0.03, 0.03, 0.75), M.frame, glasses, [0.56, 0.02, -0.38]);

    var phones = P.phones = group(head);
    mesh(new T.TorusGeometry(1.03, 0.08, 10, 40, Math.PI), M.phones, phones, [0, 0.05, 0.05], [1, 1.04, 1]);
    [-1, 1].forEach(function (s) {
      mesh(new T.CylinderGeometry(0.32, 0.32, 0.24, 24), M.phones, phones, [1.0 * s, -0.02, 0.05], null, [0, 0, Math.PI / 2]);
      mesh(new T.CylinderGeometry(0.21, 0.21, 0.26, 20), M.cup, phones, [1.06 * s, -0.02, 0.05], null, [0, 0, Math.PI / 2]);
    });

    var vr = P.vr = group(head, [0, 0.08, 0.72]);
    mesh(new T.BoxGeometry(1.36, 0.56, 0.5), M.vr, vr);
    mesh(new T.BoxGeometry(1.22, 0.42, 0.06), M.visor, vr, [0, 0, 0.27]);
    mesh(new T.TorusGeometry(0.95, 0.06, 8, 40), M.phones, vr, [0, 0, -0.7], [1, 0.62, 1], [Math.PI / 2, 0, 0]);
  }

  /* ---------------- Dither pass ---------------- */
  var FRAG = [
    "uniform sampler2D tDiffuse; uniform vec2 res; uniform vec3 ink; uniform vec3 paper;",
    "varying vec2 vUv;",
    "float bayer(vec2 p){ vec2 q=floor(mod(p,4.0)); float v;",
    " if(q.y<0.5) v= q.x<0.5?0.0:q.x<1.5?8.0:q.x<2.5?2.0:10.0;",
    " else if(q.y<1.5) v= q.x<0.5?12.0:q.x<1.5?4.0:q.x<2.5?14.0:6.0;",
    " else if(q.y<2.5) v= q.x<0.5?3.0:q.x<1.5?11.0:q.x<2.5?1.0:9.0;",
    " else v= q.x<0.5?15.0:q.x<1.5?7.0:q.x<2.5?13.0:5.0;",
    " return (v+0.5)/16.0; }",
    "void main(){",
    " vec4 c=texture2D(tDiffuse,vUv); vec2 t=1.0/res;",
    " float an=texture2D(tDiffuse,vUv+vec2(t.x,0.0)).a+texture2D(tDiffuse,vUv-vec2(t.x,0.0)).a+texture2D(tDiffuse,vUv+vec2(0.0,t.y)).a+texture2D(tDiffuse,vUv-vec2(0.0,t.y)).a;",
    " if(c.a<0.5){ if(an>0.5){ gl_FragColor=vec4(ink,1.0); } else { discard; } return; }",
    " float l=dot(c.rgb,vec3(0.299,0.587,0.114));",
    " l=pow(clamp(l*1.12,0.0,1.0),0.85);",
    " gl_FragColor=vec4(l>bayer(gl_FragCoord.xy)?paper:ink,1.0);",
    "}"
  ].join("\n");

  function setup() {
    renderer = new T.WebGLRenderer({ canvas: document.createElement("canvas"), alpha: true, antialias: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.setClearColor(0x000000, 0);

    scene = new T.Scene();
    // Framed with headroom so the hair never touches the top edge, even mid-jump.
    camera = new T.PerspectiveCamera(29, W / H, 0.1, 50);
    camera.position.set(0, -0.12, 8.9);
    camera.lookAt(0, -0.3, 0);
    scene.add(new T.AmbientLight(0xffffff, 0.42));
    var key = new T.DirectionalLight(0xffffff, 0.85);
    key.position.set(-3, 4, 6);
    scene.add(key);
    var rim = new T.DirectionalLight(0xffffff, 0.25);
    rim.position.set(4, 1, -3);
    scene.add(rim);

    rt = new T.WebGLRenderTarget(W, H, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, format: T.RGBAFormat });
    post = new T.ShaderMaterial({
      uniforms: { tDiffuse: { value: rt.texture }, res: { value: new T.Vector2(W, H) }, ink: { value: new T.Color(0x121212) }, paper: { value: new T.Color(0xffffff) } },
      vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }",
      fragmentShader: FRAG,
      transparent: true
    });
    postScene = new T.Scene();
    postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), post));
    build();
    applyOutfit(S.outfit);
  }

  function applyOutfit(name) {
    var o = OUTFITS[name] || OUTFITS.polo, polo = o.shirt === "polo";
    P.torsoPolo.visible = P.polo.visible = polo;
    P.torsoTee.visible = P.tee.visible = !polo;
    ["R", "L"].forEach(function (k) {
      P[k].sleevePolo.visible = polo;
      P[k].sleeveTee.visible = !polo;
      P[k].cap.material = polo ? M.polo : M.tee;
    });
    P.glasses.visible = !!o.glasses && !o.vr;
    P.phones.visible = !!o.phones;
    P.vr.visible = !!o.vr;
    P.R.phone.visible = !!o.phone;
    S.outfit = name;
  }

  /* ---------------- Animation ---------------- */
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function gesture(name, secs) { if (!reduced) S.gesture = { name: name, until: now() + secs }; }

  var last = 0;
  function tick(ms) {
    requestAnimationFrame(tick);
    var t = ms / 1000;
    var dt = Math.min(0.05, t - (last || t)); last = t;
    if (!views.some(function (v) { return v.visible; }) && S.spin < 0) return;

    var o = OUTFITS[S.outfit] || OUTFITS.polo;
    if (S.gesture && t > S.gesture.until) S.gesture = null;
    var g = S.gesture && S.gesture.name;

    // Scroll velocity: lean and bob a little when the page moves fast
    var sy = window.scrollY;
    S.vel += ((sy - S.scrollY) / Math.max(dt, 0.001) - S.vel) * 0.12;
    S.scrollY = sy;
    var v = calm ? 0 : Math.max(-1, Math.min(1, S.vel / 2500));

    // Where to look
    var ax = S.aim.x, ay = S.aim.y;
    if (o.phone && !g) { ax = 0.32; ay = 0.5; }
    if (S.point && !g) { ax = 0.55; ay = -0.15; }
    S.look.x += (ax - S.look.x) * 0.08;
    S.look.y += (ay - S.look.y) * 0.08;
    S.sleep += (S.sleepTo - S.sleep) * 0.05;
    S.happy = Math.max(0, S.happy - dt);
    S.oof = Math.max(0, S.oof - dt);
    S.hover += ((S.hoverSince > 0 ? 1 : 0) - S.hover) * 0.1;
    if (S.hoverSince > 0 && t - S.hoverSince > 0.5 && t - S.hoverSince < 60 && !g) { S.hoverSince = t + 1e6; gesture("wave", 1.8); }

    var breathe = reduced ? 0 : Math.sin(t * 1.7);
    P.neck.rotation.y = S.look.x * 0.55;
    P.neck.rotation.x = S.look.y * 0.3 + S.sleep * 0.38 + v * 0.25 + (g === "pat" ? 0.18 : 0);
    P.neck.rotation.z = -S.look.x * 0.06 + S.sleep * 0.12 + (reduced ? 0 : Math.sin(t * 0.9) * 0.025) + (g === "pat" ? -0.15 : 0);
    P.face.position.x = S.look.x * 0.05;
    P.face.position.y = -S.look.y * 0.04;
    P.body.scale.y = 1 + breathe * 0.012;
    P.head.position.y = 0.74 + breathe * 0.015;
    P.quiff.rotation.x = 0.35 + v * 0.6 + (reduced ? 0 : Math.sin(t * 2.3) * 0.02);

    // Face
    if (!reduced && t > S.blinkAt) { S.blinkT = t; S.blinkAt = t + 2.2 + Math.random() * 3.4; }
    var blink = S.blinkT > 0 && t - S.blinkT < 0.14 ? 0.08 : 1;
    var shut = S.sleep > 0.5 || S.happy > 0 || g === "celebrate";
    P.eyes.forEach(function (e) { e.visible = !shut; e.scale.y = blink; e.scale.x = e.scale.z = 1 + S.hover * 0.15; });
    P.shut.forEach(function (s) { s.visible = shut; s.rotation.z = S.sleep > 0.5 ? Math.PI : 0; });
    P.blush.forEach(function (b) { b.visible = S.happy > 0 || g === "highfive" || g === "celebrate"; });
    P.smile.visible = S.sleep <= 0.5 && S.oof <= 0;
    P.smile.scale.x = 1 + S.hover * 0.35 + (g === "celebrate" || g === "highfive" ? 0.4 : 0);
    P.mouthO.visible = S.sleep > 0.5 || S.oof > 0;
    P.brows.forEach(function (b) { b.position.y = 0.32 + (S.happy > 0 || S.hover > 0.5 ? 0.05 : 0) + (S.oof > 0 ? 0.07 : 0) - S.sleep * 0.03; });

    // Jelly squash, jump, grab/lean
    S.squashV += (-S.squash * 180 - S.squashV * 11) * dt;
    S.squash += S.squashV * dt;
    var jy = 0;
    if (S.jump > 0) { var j = (t - S.jump) / 0.7; if (j >= 1) S.jump = -1; else jy = Math.sin(j * Math.PI) * 0.4; }
    P.root.scale.set(1 + S.squash * 0.6, 1 - S.squash, 1 + S.squash * 0.6);
    P.root.position.y = jy;
    if (S.drag) { S.lean += (S.drag.dx * -0.004 - S.lean) * 0.2; S.leanV = 0; }
    else { S.leanV += (-(S.lean + v * 0.12) * 120 - S.leanV * 7) * dt; S.lean += S.leanV * dt; }
    P.root.rotation.z = S.lean;

    // Arms: blend toward the pose, then add the pose's own motion
    var poseName = g || (S.sleep > 0.5 ? "sleep" : S.point ? "point" : o.pose);
    var pose = POSES[poseName] || POSES.rest;
    ["R", "L"].forEach(function (k) {
      var target = pose[k], cur = S.arms[k];
      for (var i = 0; i < 4; i++) cur[i] += (target[i] - cur[i]) * (g ? 0.2 : 0.12);
      var s = k === "R" ? 1 : -1, a = cur.slice();
      if (!reduced) {
        if (poseName === "tabla") a[2] += Math.max(0, Math.sin(t * 13 + (k === "R" ? 0 : Math.PI))) * 0.45;
        if (poseName === "rings") { a[0] += Math.sin(t * 2.6 + (k === "R" ? 0 : 1.4)) * 0.12; a[3] += Math.sin(t * 3.1) * 0.25; }
        if (poseName === "wave" && k === "R") a[3] = Math.sin(t * 12) * 0.55;
        if (poseName === "celebrate") a[0] += Math.sin(t * 9 + (k === "R" ? 0 : 1)) * 0.15;
        if (poseName === "point" && k === "R") a[0] += Math.sin(t * 4) * 0.04;
        if (poseName === "rest") a[2] += Math.sin(t * 1.7 + (k === "R" ? 0 : 0.6)) * 0.03;
      }
      var arm = P[k];
      arm.shoulder.rotation.set(a[1], 0, a[0] * s);
      arm.elbow.rotation.set(a[2], 0, a[3] * s);
      arm.hand.rotation.set(poseName === "highfive" && k === "R" ? -1.2 : 0, 0, 0);
    });

    // Outfit change: a quick spin, swapping clothes while facing away. Double-click: jump + spin.
    if (S.spin >= 0) {
      var sp = Math.min(1, (t - S.spin) / 0.75);
      P.root.rotation.y = easeInOut(sp) * Math.PI * 2;
      if (sp >= 0.5 && S.pending) { applyOutfit(S.pending); S.pending = null; }
      if (sp >= 1) { S.spin = -1; P.root.rotation.y = 0; }
    } else if (S.jump > 0) {
      P.root.rotation.y = easeInOut(Math.min(1, (t - S.jump) / 0.7)) * Math.PI * 2;
    } else {
      P.root.rotation.y = 0;
    }

    render();
  }

  function render() {
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(postScene, postCam);
    views.forEach(function (v) {
      if (!v.visible) return;
      v.ctx.clearRect(0, 0, W, H);
      v.ctx.drawImage(renderer.domElement, 0, 0);
    });
  }

  /* ---------------- Public API ---------------- */
  var Mascot = {
    supported: function () { return webgl(); },

    init: function () {
      setup();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          views.forEach(function (v) { if (v.el === en.target) v.visible = en.isIntersecting; });
        });
      });
      document.querySelectorAll(".me canvas").forEach(function (c) {
        c.width = W; c.height = H;
        var ctx = c.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        views.push({ el: c, ctx: ctx, visible: true });
        io.observe(c);
      });
      window.addEventListener("pointermove", function (e) {
        var v = views.filter(function (x) { return x.visible; })[0];
        if (!v) return;
        var r = v.el.getBoundingClientRect();
        S.aim.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.5)));
        S.aim.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.35)) / (innerHeight * 0.6)));
        if (S.drag) S.drag.dx = e.clientX - S.drag.x;
      }, { passive: true });
      window.addEventListener("pointerup", function () { S.drag = null; });
      requestAnimationFrame(tick);
    },

    wear: function (name) {
      if (typeof name === "number") name = ORDER[((name % ORDER.length) + ORDER.length) % ORDER.length];
      if (!OUTFITS[name]) return;
      if (S.spin < 0 && name === S.outfit) { S.pending = null; return; }
      if (name === S.pending) return;
      if (reduced) { applyOutfit(name); return; }
      S.pending = name;
      if (S.spin < 0) S.spin = now();
    },
    next: function () { this.wear(ORDER[(ORDER.indexOf(S.pending || S.outfit) + 1) % ORDER.length]); },
    outfit: function () { return S.pending || S.outfit; },

    point: function (on) { S.point = !!on; },
    wave: function () { gesture("wave", 2); },
    cheer: function () { gesture("celebrate", 1.6); },
    jump: function () { S.jump = now(); },
    sleep: function (on) {
      if (!on && S.sleepTo) gesture("stretch", 1.4);
      S.sleepTo = on ? 1 : 0;
    },
    hover: function (on) { S.hoverSince = on ? now() : -1; },
    grab: function (x) { S.drag = { x: x, dx: 0 }; },

    // Click reaction by where you hit: head = pat, hands = high five, body = poke.
    react: function (y) {
      if (y < 0.48) { S.happy = 1.6; S.squash = 0.06; S.squashV = 0; gesture("pat", 1.2); return "pat"; }
      if (y > 0.8) { S.happy = 1; gesture("highfive", 1.3); return "highfive"; }
      S.oof = 0.5; S.squash = 0.14; S.squashV = 0;
      return "poke";
    }
  };

  window.Mascot3D = Mascot;
})();
