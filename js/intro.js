/* Opening screen: a plain JavaScript port of the "HyperGrid" moving-grid hero.
   Shown on the home page once per browser session, and again whenever the name badge in the header is clicked. A tilted 3D grid drifts
   forward, follows the cursor and lights up around it; "Enter" fires the warp
   jump, then the screen fades out to reveal the portfolio. */
(function () {
  "use strict";
  var ss = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  var forced = /[?&]intro\b/.test(location.search);
  var isHome = document.body.dataset.page === "home";
  // The name badge in the header calls this to replay the opening screen.
  window.showIntro = function () { if (!document.querySelector(".hg-intro")) run(); };


  // --- image corridor (port of "ImageStreamHero"): two mirrored rails of
  // portfolio photos flying from a vanishing point toward the viewer ---
  var STREAM_IMAGES = [
    "images/intro/field-farmers.jpg",
    "images/publications/ipadi-eja-2027-thumb.jpg",
    "images/intro/hackathon-poster.jpg",
    "images/intro/wwc-poster.jpg",
    "images/events/pcci-stakeholder-workshop-2026-1-thumb.jpg",
    "images/projects/p1-arboriculture-tadla-thumb.jpg",
    "images/intro/um6p-campus.jpg",
    "images/intro/wwc-award.jpg",
    "images/events/iahr-africa-2024-1-thumb.jpg",
    "images/publications/trees-srs-2026-thumb.jpg",
    "images/intro/geophysics-team.jpg",
    "images/intro/water-day-award.jpg",
    "images/events/doukkala-survey-2025-2-thumb.jpg",
    "images/projects/p3-ipadi-doukkala-thumb.jpg",
    "images/intro/farmer-interview.jpg",
    "images/intro/field-canal.jpg",
    "images/events/roy-visit-2025-1-thumb.jpg",
    "images/publications/hdci-jhrs-2025-thumb.jpg",
    "images/events/rive-symposium-2026-thumb.jpg",
    "images/events/um6p-agroparistech-2025-3-thumb.jpg",
    "images/publications/propagation-rs-2025-thumb.jpg",
    "images/events/geophysics-ert-2a-thumb.jpg",
    "images/publications/dam-forecasting-jhrs-2026-thumb.jpg",
    "images/events/msc-defense-angoue-1-thumb.jpg"
  ];
  var CP = { perspective: 30, cardWidth: 18, cardHeight: 25, cardRadius: 0.6, birthHeight: 2.6, exitHeight: 46, railBirth: -11, railExit: 44, fan: 3.3, turnBirth: 6, turnExit: 28, stops: 24 };
  var CARDS = 12, SPEED = 26, AXIS = 52;
  function corridorKeyframes(dir, name) {
    var out = [];
    for (var k = 0; k <= CP.stops; k++) {
      var u = k / CP.stops;
      var scale = (CP.birthHeight / CP.cardHeight) * Math.pow(CP.exitHeight / CP.birthHeight, u);
      var z = CP.perspective * (1 - 1 / scale);
      var rail = CP.railExit - (CP.railExit - CP.railBirth) * Math.pow(1 - u, CP.fan);
      var turn = CP.turnBirth + (CP.turnExit - CP.turnBirth) * u;
      out.push((u * 100).toFixed(2) + "%{transform:translate3d(" + (dir * rail).toFixed(2) + "cqw,0," + z.toFixed(2) + "cqw) rotateY(" + (-dir * turn).toFixed(2) + "deg)}");
    }
    return "@keyframes " + name + "{" + out.join("") + "}";
  }
  function streamHtml() {
    if (!document.getElementById("hgStreamCss")) {
      var st = document.createElement("style"); st.id = "hgStreamCss";
      st.textContent = corridorKeyframes(1, "hgRailR") + corridorKeyframes(-1, "hgRailL") + "@media(prefers-reduced-motion:reduce){.hg-card{animation-play-state:paused!important}}";
      document.head.appendChild(st);
    }
    var cards = "";
    ["hgRailR", "hgRailL"].forEach(function (rail, r) {
      for (var i = 0; i < CARDS; i++) {
        var src = STREAM_IMAGES[(i * 2 + r) % STREAM_IMAGES.length]; // 2 rails x CARDS = each photo once
        cards += '<div class="hg-card" style="left:50%;top:' + AXIS + '%;width:' + CP.cardWidth + 'cqw;height:' + CP.cardHeight + 'cqw;margin-left:' + (-CP.cardWidth / 2) + 'cqw;margin-top:' + (-CP.cardHeight / 2) + 'cqw;border-radius:' + CP.cardRadius + 'cqw;animation:' + rail + ' ' + SPEED + 's linear infinite;animation-delay:' + (-(i * SPEED) / CARDS).toFixed(2) + 's"><img src="' + src + '" alt="" decoding="async" draggable="false"></div>';
      }
    });
    return '<div class="hg-stream" aria-hidden="true"><div class="hg-stream-persp" style="perspective:' + CP.perspective + 'cqw;perspective-origin:50% ' + AXIS + '%"><div class="hg-stream-stage">' + cards + '</div></div></div>';
  }

  function run() {

  var lang = "en";
  try { lang = localStorage.getItem("lang") || "en"; } catch (e) {}
  var TXT = {
    en: { badge: "Earth observation · AI · Drought", sub: "PhD Researcher turning satellite observations, hydroclimatic models and socioeconomic data into drought resilience.", enter: "Enter the portfolio", hint: "Move to steer the grid" },
    fr: { badge: "Observation de la Terre · IA · Sécheresse", sub: "Doctorant qui transforme les observations satellitaires, les modèles hydroclimatiques et les données socioéconomiques en résilience face à la sécheresse.", enter: "Entrer dans le portfolio", hint: "Bougez la souris pour guider la grille" }
  }[lang === "fr" ? "fr" : "en"];

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GRID = 100, SPEED = 0.4, MASK = 400;

  function layer(id, stroke, width) {
    return '<svg class="hg-layer" aria-hidden="true"><defs><pattern id="' + id + '" width="' + GRID + '" height="' + GRID + '" patternUnits="userSpaceOnUse">' +
      '<path d="M ' + GRID + ' 0 L 0 0 0 ' + GRID + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '" shape-rendering="geometricPrecision"/></pattern></defs>' +
      '<rect width="100%" height="100%" fill="url(#' + id + ')"/></svg>';
  }

  var el = document.createElement("div");
  el.className = "hg-intro";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Sabir OUSSAOUI");
  el.innerHTML =
    '<div class="hg-noise"></div>' +
    '<div class="hg-orbs" aria-hidden="true"><i></i><i></i></div>' +
    streamHtml() +
    '<div class="hg-grid">' +
      layer("hgBase", "rgba(255,255,255,0.05)", 1) +
      '<div class="hg-mask">' + layer("hgHi", "rgba(255,255,255,0.22)", 1) +
        '<div class="hg-warp-grid">' + layer("hgWarp", "rgba(139,92,246,0.85)", 2) + '</div></div>' +
    '</div>' +
    '<div class="hg-flash"></div><div class="hg-dodge"></div>' +
    '<div class="hg-content">' +
      '<div class="hg-text">' +
        '<div class="hg-item hg-badge"><span class="hg-dot"><i></i><b></b></span>' + TXT.badge + '</div>' +
        '<h1 class="hg-item hg-name">Sabir <br><span>OUSSAOUI</span></h1>' +
        '<p class="hg-item hg-sub">' + TXT.sub + '</p>' +
        '<div class="hg-item hg-cta"><button type="button" class="hg-btn"><span>' + TXT.enter + '</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg><em></em></button>' +
        '<p class="hg-hint">' + TXT.hint + '</p></div>' +
      '</div>' +
      '<div class="hg-item hg-figure"><canvas class="hg-globe" aria-hidden="true"></canvas>' +
        '<img class="hg-photo" src="images/profile/intro-cutout.webp" alt="Sabir OUSSAOUI" width="1038" height="1400" decoding="async"></div>' +
    '</div>';
  document.body.appendChild(el);
  document.documentElement.classList.add("hg-lock");

  var grid = el.querySelector(".hg-grid"), mask = el.querySelector(".hg-mask"), warpGrid = el.querySelector(".hg-warp-grid");
  var content = el.querySelector(".hg-content"), flash = el.querySelector(".hg-flash"), dodge = el.querySelector(".hg-dodge"), orbs = el.querySelector(".hg-orbs");
  var patterns = Array.prototype.slice.call(el.querySelectorAll("pattern"));
  var paths = Array.prototype.slice.call(el.querySelectorAll("pattern path"));
  var btn = el.querySelector(".hg-btn");

  // Intro: grid zooms in from a point while the text rises out of a blur.
  requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("hg-in"); }); });
  // After the zoom-in, drop the CSS transition so the tilt tracks the cursor directly.
  setTimeout(function () { el.classList.add("hg-ready"); }, 1900);

  // --- state (springs approximated with frame-rate independent easing) ---
  var W = innerWidth, H = innerHeight;
  var mouse = [W / 2, H / 2], lag = [W / 2, H / 2], prev = [W / 2, H / 2];
  var vel = [0, 0], velS = [0, 0], rot = [0, 0];
  var gx = 0, gy = 0, warp = 0, warpTarget = 0, leaving = false, raf = 0, last = performance.now();
  var ease = function (c, t, dt, rate) { return c + (t - c) * (1 - Math.exp(-dt * rate)); };

  function onResize() { W = innerWidth; H = innerHeight; }
  window.addEventListener("resize", onResize);
  el.addEventListener("pointermove", function (e) {
    vel = [e.clientX - prev[0], e.clientY - prev[1]];
    mouse = [e.clientX, e.clientY]; prev = [e.clientX, e.clientY];
  });


  // --- network globe behind the portrait (2D canvas, projected 3D) ---
  var gc = el.querySelector(".hg-globe"), g2 = gc.getContext("2d");
  var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  var nodes = [];
  for (var k = 0; k < 26; k++) {
    var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, rr = Math.sqrt(1 - u * u);
    nodes.push([rr * Math.cos(th), u, rr * Math.sin(th), 0.6 + rnd() * 0.9]);
  }
  var links = [];
  for (var a1 = 0; a1 < nodes.length; a1++) for (var b1 = a1 + 1; b1 < nodes.length; b1++) {
    var dx = nodes[a1][0] - nodes[b1][0], dy = nodes[a1][1] - nodes[b1][1], dz = nodes[a1][2] - nodes[b1][2];
    if (dx * dx + dy * dy + dz * dz < 0.55) links.push([a1, b1]);
  }
  var dust = [];
  for (var k2 = 0; k2 < 260; k2++) { var u2 = rnd() * 2 - 1, t2 = rnd() * Math.PI * 2, r2 = Math.sqrt(1 - u2 * u2); dust.push([r2 * Math.cos(t2), u2, r2 * Math.sin(t2)]); }
  var rings = [[1.32, 0.42, 0.3], [1.5, -0.62, 1.4], [1.18, 1.15, 2.2]]; // radius, tilt, phase
  var gw = 0, gh = 0, gdpr = 1, spin = 0.6;
  function sizeGlobe() {
    gdpr = Math.min(devicePixelRatio || 1, 2);
    gw = gc.clientWidth; gh = gc.clientHeight;
    gc.width = Math.round(gw * gdpr); gc.height = Math.round(gh * gdpr);
  }
  function rotP(p, ay, ax) {
    var x = p[0] * Math.cos(ay) + p[2] * Math.sin(ay), z = -p[0] * Math.sin(ay) + p[2] * Math.cos(ay);
    var y = p[1] * Math.cos(ax) - z * Math.sin(ax); z = p[1] * Math.sin(ax) + z * Math.cos(ax);
    return [x, y, z];
  }
  function drawGlobe(t) {
    if (!gw) return;
    var R = Math.min(gw * 0.42, gh * 0.4), cx = gw * 0.5, cy = gh * 0.42;
    var ay = spin + t * 0.12 + (rot[1] || 0) * 0.02, ax = -0.32 + (rot[0] || 0) * 0.015;
    var P = function (p) { var q = rotP(p, ay, ax); return [cx + q[0] * R, cy - q[1] * R, q[2]]; };
    g2.setTransform(gdpr, 0, 0, gdpr, 0, 0);
    g2.clearRect(0, 0, gw, gh);
    var glow = g2.createRadialGradient(cx, cy, R * 0.15, cx, cy, Math.min(R * 1.25, gw * 0.5, gh * 0.42));
    glow.addColorStop(0, "rgba(91,33,182,.32)"); glow.addColorStop(1, "rgba(70,120,220,0)");
    g2.fillStyle = glow; g2.fillRect(0, 0, gw, gh);
    g2.lineWidth = 1;
    // meridians and parallels
    for (var m = 0; m < 12; m++) {
      var lon = m / 12 * Math.PI;
      g2.beginPath();
      for (var s1 = 0; s1 <= 48; s1++) {
        var lat = -Math.PI / 2 + s1 / 48 * Math.PI;
        var pt = P([Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]);
        if (s1) g2.lineTo(pt[0], pt[1]); else g2.moveTo(pt[0], pt[1]);
      }
      g2.strokeStyle = "rgba(167,139,250,.16)"; g2.stroke();
    }
    for (var l = -2; l <= 2; l++) {
      var la = l * Math.PI / 6;
      g2.beginPath();
      for (var s2 = 0; s2 <= 64; s2++) {
        var lo = s2 / 64 * Math.PI * 2, pt2 = P([Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)]);
        if (s2) g2.lineTo(pt2[0], pt2[1]); else g2.moveTo(pt2[0], pt2[1]);
      }
      g2.strokeStyle = "rgba(167,139,250,.14)"; g2.stroke();
    }
    // dust
    for (var d1 = 0; d1 < dust.length; d1++) {
      var q1 = P(dust[d1]); g2.fillStyle = "rgba(196,181,253," + (q1[2] > 0 ? .35 : .1) + ")";
      g2.fillRect(q1[0], q1[1], 1.1, 1.1);
    }
    // orbit rings with travelling satellites
    for (var r3 = 0; r3 < rings.length; r3++) {
      var rg = rings[r3]; g2.beginPath();
      for (var s3 = 0; s3 <= 96; s3++) {
        var an = s3 / 96 * Math.PI * 2;
        var p3 = rotP([Math.cos(an) * rg[0], 0, Math.sin(an) * rg[0]], 0, rg[1]);
        var q3 = P(p3); if (s3) g2.lineTo(q3[0], q3[1]); else g2.moveTo(q3[0], q3[1]);
      }
      g2.strokeStyle = "rgba(167,139,250,.30)"; g2.stroke();
      var sa2 = rg[2] + t * (0.25 + r3 * 0.08);
      var sat = P(rotP([Math.cos(sa2) * rg[0], 0, Math.sin(sa2) * rg[0]], 0, rg[1]));
      g2.shadowColor = "rgba(251,191,36,.9)"; g2.shadowBlur = 14;
      g2.fillStyle = "rgba(253,230,138," + (sat[2] > 0 ? .95 : .45) + ")";
      g2.beginPath(); g2.arc(sat[0], sat[1], 3.2, 0, Math.PI * 2); g2.fill(); g2.shadowBlur = 0;
    }
    // network links and nodes
    var pr = nodes.map(P);
    for (var e1 = 0; e1 < links.length; e1++) {
      var A = pr[links[e1][0]], B = pr[links[e1][1]], vis = (A[2] + B[2]) / 2;
      g2.strokeStyle = "rgba(196,181,253," + (vis > 0 ? .5 : .12) + ")";
      g2.beginPath(); g2.moveTo(A[0], A[1]); g2.lineTo(B[0], B[1]); g2.stroke();
    }
    for (var n1 = 0; n1 < pr.length; n1++) {
      var Q = pr[n1], front = Q[2] > 0, tw = 0.75 + 0.25 * Math.sin(t * 1.6 + n1);
      g2.shadowColor = "rgba(139,92,246,.95)"; g2.shadowBlur = front ? 16 : 4;
      g2.fillStyle = "rgba(237,233,254," + (front ? .95 * tw : .3) + ")";
      g2.beginPath(); g2.arc(Q[0], Q[1], nodes[n1][3] * (front ? 3 : 1.8), 0, Math.PI * 2); g2.fill();
    }
    g2.shadowBlur = 0;
  }
  sizeGlobe();
  window.addEventListener("resize", sizeGlobe);

  function frame(now) {
    raf = 0;
    var dtMs = Math.min(now - last, 100), dt = dtMs / 1000;
    last = now;
    warp = ease(warp, warpTarget, dt, warpTarget > warp ? 14 : 6);
    lag = [ease(lag[0], mouse[0], dt, 9), ease(lag[1], mouse[1], dt, 9)];
    velS = [ease(velS[0], vel[0], dt, 3), ease(velS[1], vel[1], dt, 3)];
    vel = [vel[0] * Math.exp(-dt * 8), vel[1] * Math.exp(-dt * 8)];

    // Tilt follows the cursor; the warp exaggerates it.
    var rx = (8 - 16 * (mouse[1] / Math.max(H, 1))) * (1 + warp * 2);
    var ry = (-8 + 16 * (mouse[0] / Math.max(W, 1))) * (1 + warp * 2);
    rot = [ease(rot[0], rx, dt, 3), ease(rot[1], ry, dt, 3)];

    var cell = GRID * (1 - 0.2 * warp);
    var mult = 1 + warp * 24;
    var nvx = Math.max(-2, Math.min(2, velS[0] / 100)), nvy = Math.max(-2, Math.min(2, velS[1] / 100));
    gx = (gx + nvx * SPEED * mult * (dtMs / 16)) % cell;
    gy = (gy + (nvy - 0.3 * mult) * SPEED * mult * (dtMs / 16)) % cell;

    for (var i = 0; i < patterns.length; i++) {
      patterns[i].setAttribute("x", gx); patterns[i].setAttribute("y", gy);
      patterns[i].setAttribute("width", cell); patterns[i].setAttribute("height", cell);
      paths[i].setAttribute("d", "M " + cell + " 0 L 0 0 0 " + cell);
    }
    grid.style.setProperty("--rx", rot[0].toFixed(3) + "deg");
    grid.style.setProperty("--ry", rot[1].toFixed(3) + "deg");
    var mi = Math.round(255 * Math.max(0.55, warp)), mr = MASK * (1 + 0.5 * warp);
    var m = "radial-gradient(" + mr.toFixed(0) + "px circle at " + lag[0].toFixed(1) + "px " + lag[1].toFixed(1) + "px, rgb(" + mi + "," + mi + "," + mi + "), transparent)";
    mask.style.maskImage = m; mask.style.webkitMaskImage = m;
    warpGrid.style.opacity = warp.toFixed(3);
    content.style.transform = "scale(" + (1 - 0.08 * warp).toFixed(4) + ")";
    orbs.style.filter = "hue-rotate(" + (40 * warp).toFixed(1) + "deg) saturate(" + (1 + 0.5 * warp).toFixed(2) + ")";
    flash.style.opacity = (warp < 0.1 ? warp * 4 : 0.4 * (1 - (warp - 0.1) / 0.9)).toFixed(3);
    dodge.style.opacity = (warp < 0.2 ? warp * 1.5 : warp < 0.8 ? 0.3 * (1 - (warp - 0.2) / 0.6) : 0).toFixed(3);

    drawGlobe(now / 1000);
    if (el.isConnected) raf = requestAnimationFrame(frame);
  }
  if (!reduced) raf = requestAnimationFrame(frame);
  else { var img0 = el.querySelector(".hg-photo"); drawGlobe(0); if (img0) img0.addEventListener("load", function () { drawGlobe(0); }); }

  function enter() {
    if (leaving) return;
    leaving = true;
    ss.set("introSeen", "1");
    if (reduced) { close(); return; }
    warpTarget = 1;
    setTimeout(function () { el.classList.add("hg-out"); }, 900);
    setTimeout(close, 1700);
  }
  function close() {
    window.removeEventListener("resize", onResize); window.removeEventListener("resize", sizeGlobe);
    cancelAnimationFrame(raf); raf = 0;
    el.remove();
    document.documentElement.classList.remove("hg-lock");
  }
  btn.addEventListener("click", enter);
  document.addEventListener("keydown", function onKey(e) {
    if (!el.isConnected) { document.removeEventListener("keydown", onKey); return; }
    if (e.key === "Enter" || e.key === "Escape" || e.key === " ") { e.preventDefault(); enter(); }
  });
  setTimeout(function () { try { btn.focus({ preventScroll: true }); } catch (e) {} }, 400);
  }
  if (isHome && (!ss.get("introSeen") || forced)) run();
})();
