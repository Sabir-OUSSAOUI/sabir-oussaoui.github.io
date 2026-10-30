/* Opening screen: a plain JavaScript port of the "HyperGrid" moving-grid hero.
   Shown on the home page once per browser session. A tilted 3D grid drifts
   forward, follows the cursor and lights up around it; "Enter" fires the warp
   jump, then the screen fades out to reveal the portfolio. */
(function () {
  "use strict";
  var ss = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  var forced = /[?&]intro\b/.test(location.search);
  if (ss.get("introSeen") && !forced) return;

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
    '<div class="hg-grid">' +
      layer("hgBase", "rgba(255,255,255,0.05)", 1) +
      '<div class="hg-mask">' + layer("hgHi", "rgba(255,255,255,0.22)", 1) +
        '<div class="hg-warp-grid">' + layer("hgWarp", "rgba(100,200,255,0.8)", 2) + '</div></div>' +
    '</div>' +
    '<div class="hg-flash"></div><div class="hg-dodge"></div>' +
    '<div class="hg-content">' +
      '<div class="hg-item hg-badge"><span class="hg-dot"><i></i><b></b></span>' + TXT.badge + '</div>' +
      '<h1 class="hg-item hg-name">Sabir <span>OUSSAOUI</span></h1>' +
      '<p class="hg-item hg-sub">' + TXT.sub + '</p>' +
      '<div class="hg-item hg-cta"><button type="button" class="hg-btn"><span>' + TXT.enter + '</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg><em></em></button>' +
      '<p class="hg-hint">' + TXT.hint + '</p></div>' +
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

  window.addEventListener("resize", function () { W = innerWidth; H = innerHeight; });
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

    if (!leaving || warp > 0.002 || el.isConnected) raf = requestAnimationFrame(frame);
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
})();
