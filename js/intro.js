/* Opening screen: the name over a corridor of portfolio photos (port of
   "ImageStreamHero") and a moving 3D grid (port of "HyperGrid") that tilts with
   the cursor. Shown on the home page once per browser session, and again when
   the name badge in the header is clicked; "Enter" fires the warp jump, then
   the screen fades out to reveal the portfolio. */
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
  var CP = { perspective: 30, cardWidth: 18, cardHeight: 25, cardRadius: 0.6, birthHeight: 2.6, exitHeight: 46, railBirth: -11, railExit: 44, fan: 3.3, turnBirth: 6, turnExit: 28 };
  var CARDS = 8, SPEED = 24, AXIS = 52;
  // Each card's position along the path is retimed so that two neighbouring
  // cards (one time-step apart) always overlap by OVERLAP of their width on screen.
  var OVERLAP = 0.20, STEPS_PER_CARD = 6;
  function pathAt(u) {
    var scale = (CP.birthHeight / CP.cardHeight) * Math.pow(CP.exitHeight / CP.birthHeight, u);
    return { z: CP.perspective * (1 - 1 / scale), rail: CP.railExit - (CP.railExit - CP.railBirth) * Math.pow(Math.max(0, 1 - u), CP.fan), turn: CP.turnBirth + (CP.turnExit - CP.turnBirth) * u };
  }
  function edges(u) {
    var q = pathAt(u), t = q.turn * Math.PI / 180;
    var f = function (dx) { return (q.rail + dx * Math.cos(t)) * CP.perspective / (CP.perspective - (q.z + dx * Math.sin(t))); };
    return [f(-CP.cardWidth / 2), f(CP.cardWidth / 2)];
  }
  function overlap(a, b) { var A = edges(a), B = edges(b); return (A[1] - B[0]) / (A[1] - A[0]); }
  function nextU(u) { var lo = u + 1e-6, hi = u + 0.6; for (var n = 0; n < 50; n++) { var m = (lo + hi) / 2; if (overlap(u, m) > OVERLAP) lo = m; else hi = m; } return (lo + hi) / 2; }
  var TIMING = (function () {
    var first = nextU(0), us = [], total = CARDS * STEPS_PER_CARD;
    for (var k = 0; k <= STEPS_PER_CARD; k++) us.push(first * k / STEPS_PER_CARD);
    for (var k2 = STEPS_PER_CARD + 1; k2 <= total; k2++) us.push(nextU(us[k2 - STEPS_PER_CARD]));
    return us;
  })();
  function corridorKeyframes(dir, name) {
    var out = [], total = TIMING.length - 1;
    for (var k = 0; k <= total; k++) {
      var q = pathAt(TIMING[k]);
      out.push((k / total * 100).toFixed(3) + "%{transform:translate3d(" + (dir * q.rail).toFixed(2) + "cqw,0," + q.z.toFixed(2) + "cqw) rotateY(" + (-dir * q.turn).toFixed(2) + "deg)}");
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
        var src = STREAM_IMAGES[(r * CARDS + i) % STREAM_IMAGES.length]; // photos rotate on each loop (see animationiteration)
        cards += '<div class="hg-card" style="left:50%;top:' + AXIS + '%;width:' + CP.cardWidth + 'cqw;height:' + CP.cardHeight + 'cqw;margin-left:' + (-CP.cardWidth / 2) + 'cqw;margin-top:' + (-CP.cardHeight / 2) + 'cqw;border-radius:' + CP.cardRadius + 'cqw;animation:' + rail + ' ' + SPEED + 's linear infinite;animation-delay:' + (-(i * SPEED) / CARDS).toFixed(2) + 's"><img src="' + src + '" alt="" decoding="async" draggable="false"></div>';
      }
    });
    setTimeout(function () {
      var cardsEls = document.querySelectorAll(".hg-card"), slots = cardsEls.length;
      Array.prototype.forEach.call(cardsEls, function (c, n) {
        var loop = 0;
        c.addEventListener("animationiteration", function () { loop++; c.querySelector("img").src = STREAM_IMAGES[(n + loop * slots) % STREAM_IMAGES.length]; });
      });
    }, 0);
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
        '<h1 class="hg-item hg-name">Sabir OUSSAOUI</h1>' +
        '<p class="hg-item hg-sub">' + TXT.sub + '</p>' +
        '<div class="hg-item hg-cta"><button type="button" class="hg-btn"><span>' + TXT.enter + '</span>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg><em></em></button>' +
        '<p class="hg-hint">' + TXT.hint + '</p></div>' +
      '</div>' +
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

    if (el.isConnected) raf = requestAnimationFrame(frame);
  }
  if (!reduced) raf = requestAnimationFrame(frame);

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
    window.removeEventListener("resize", onResize);
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
