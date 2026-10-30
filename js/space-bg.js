/* Black hole background: a vanilla port of the "Etched Accretion" WebGL2 scene.
   Fully procedural (no textures, no network). Shown behind every page in dark mode.
   Move the pointer for parallax; hold on an empty area to feed the singularity.
   Honours prefers-reduced-motion with one still frame. */
(function () {
  "use strict";
  var P = {
    diskColor: "#d3121f", streakColor: "#e9e4df", glowColor: "#ffffff", cloudColor: "#c9d0e2", background: "#030307",
    center: [0.5, 0.49], holeSize: 0.052, angle: 13, inclination: 0.27, diskRadius: 1.35,
    speed: 1, shear: 1, streakDensity: 150, crimson: 0.62, doppler: 0.35, flare: 0.75, lensing: 1,
    clouds: 1, cloudLines: 44, stars: 1, grain: 1, vignette: 0.6, exposure: 1.0
  };
  var root = document.documentElement;
  var canvas = document.createElement("canvas");
  canvas.id = "spaceBg";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  root.classList.add("has-space");

  var gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" });
  if (!gl) { canvas.remove(); root.classList.add("no-space-gl"); return; }

  var VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
  var FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;
uniform float uTime;
uniform float uClock;
uniform float uFeed;
uniform vec2 uParallax;

uniform vec3 uDisk;
uniform vec3 uStreak;
uniform vec3 uGlow;
uniform vec3 uCloud;
uniform vec3 uBg;

uniform vec2 uCenter;
uniform float uHole;
uniform float uAngle;
uniform float uIncl;
uniform float uDiskRadius;
uniform float uShear;
uniform float uDensity;
uniform float uCrimson;
uniform float uDoppler;
uniform float uFlare;
uniform float uLensing;
uniform float uClouds;
uniform float uCloudLines;
uniform float uStars;
uniform float uGrain;
uniform float uVignette;
uniform float uExposure;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x),
             mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), u.x),
                mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), u.x), u.y);
  float b = mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), u.x),
                mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), u.x), u.y);
  return mix(a, b, u.z);
}
float fbm(vec2 p, int oct) {
  float s = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 7; i++) {
    if (i >= oct) break;
    s += a * noise2(p);
    p = m * p + 17.13;
    a *= 0.5;
  }
  return s;
}

// A hair-thin line on every integer of x, anti-aliased by its own footprint.
// Where lines crowd tighter than a pixel it settles to their average instead
// of shimmering into moire.
// w is the share of each period the line covers.
float lines(float x, float w) {
  float fw = fwidth(x) + 1e-5;
  float dist = 0.5 - abs(fract(x) - 0.5);
  float l = 1.0 - smoothstep(w * 0.5 - fw, w * 0.5 + fw, dist);
  return mix(l, w, smoothstep(0.25, 0.7, fw));
}

// Nebula density: domain-warped fbm, drifting.
float nebula(vec2 w, float t) {
  vec2 q = vec2(fbm(w * 1.1 + vec2(0.0, t * 0.012), 4),
                fbm(w * 1.1 + vec2(5.2, 1.3) - t * 0.009, 4));
  return fbm(w * 1.8 + 1.5 * q, 6);
}

// Engraved nebula bank: returns (colour, coverage).
vec4 bank(vec2 w, float mask, float t, vec2 toHole, float px) {
  float d = nebula(w, t);
  float body = d + 0.42 * (mask - 1.0) + 0.05 * mask + 0.1 * (uClouds - 1.0);
  float cover = smoothstep(0.5, 0.56, body);
  if (cover <= 0.0) return vec4(0.0);
  // Wrinkle the contour coordinate so the lines tremble like a burin cut.
  float x = (d + 0.012 * noise2(w * 55.0)) * uCloudLines;
  float ink = max(lines(x, 0.16), 0.45 * lines(x * 2.7 + 3.0 * noise2(w * 9.0), 0.12));
  // Rim: brightest right at the silhouette, fading into the mass.
  float rim = 1.0 - smoothstep(0.0, 0.07, body - 0.5);
  // Light from the horizon glow, off the density slope.
  vec2 g = vec2(dFdx(d), dFdy(d)) / px;
  float lam = clamp(0.5 + 0.5 * dot(-normalize(g + 1e-5), toHole), 0.0, 1.0);
  float lit = ink * (0.26 + 0.95 * rim) * (0.3 + 0.7 * lam) + rim * rim * 0.12 * lam;
  vec3 col = uBg * 0.55 + uCloud * lit;
  return vec4(col, cover);
}

float starField(vec2 w, float scale, float dens, float t) {
  vec2 g = w * scale;
  vec2 id = floor(g);
  float h = hash12(id);
  if (h < 1.0 - dens) return 0.0;
  vec2 o = vec2(hash12(id + 7.1), hash12(id + 3.7)) - 0.5;
  float dpx = length(fract(g) - 0.5 - o * 0.7) / scale * uRes.y;
  float tw = 0.65 + 0.35 * sin(t * (1.5 + h * 3.0) + h * 60.0);
  return exp(-dpx * dpx * 0.9) * tw * (0.4 + 0.6 * hash12(id + 1.9));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float px = 1.0 / uRes.y;
  float aspect = uRes.x / uRes.y;
  vec2 uv = (frag - 0.5 * uRes) * px;
  float t = uTime;

  vec2 c = vec2((uCenter.x - 0.5) * aspect, 0.5 - uCenter.y);
  vec2 p = uv - c - uParallax * 0.012;

  // Disk frame: undo the clockwise roll, then open the plane back out.
  float ang = radians(uAngle) + uParallax.x * 0.03;
  float ca = cos(ang), sa = sin(ang);
  vec2 pr = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);
  float incl = clamp(uIncl + uParallax.y * 0.035, 0.06, 0.98);
  vec2 q = vec2(pr.x, pr.y / incl);
  float r = length(q);

  float Rh = uHole * (1.0 + 0.06 * uFeed);
  float d = length(p);
  vec2 dir = p / max(d, 1e-5);

  // ---- background: lensed stars and far nebula ---------------------------
  float RE = Rh * 1.7 * uLensing;
  vec2 pl = p * (1.0 - min(RE * RE / max(d * d, 1e-6), 1.6));
  vec2 uvL = pl + c;

  vec3 col = uBg + vec3(0.004, 0.008, 0.024) * smoothstep(-0.2, 0.6, uv.y + 0.3 * uv.x);
  float st = starField(uvL + uParallax * 0.004, 42.0, 0.09 * uStars, uClock)
           + 0.7 * starField(uvL + uParallax * 0.002 + 3.3, 95.0, 0.07 * uStars, uClock);
  col += vec3(0.92, 0.94, 1.0) * st;

  vec2 toHole = normalize(c - uv + 1e-5);

  if (uClouds > 0.0) {
    float maskT = smoothstep(-0.02, 0.3, pr.y + 0.15 * pr.x - 0.06);
    if (maskT > 0.0) {
      vec4 b = bank(uvL * 0.95 + uParallax * 0.02 + vec2(t * 0.004, 0.0), maskT, t, toHole, px);
      // A cold navy cast along the upper bank.
      b.rgb += vec3(0.02, 0.03, 0.09) * b.a * smoothstep(0.1, 0.5, uv.y);
      col = mix(col, b.rgb, b.a);
    }
  }

  // ---- the horizon itself -------------------------------------------------
  float inside = 1.0 - smoothstep(Rh - px, Rh + px, d);
  vec2 sp = p / Rh;
  float z = sqrt(max(0.0, 1.0 - dot(sp, sp)));
  vec3 n = vec3(sp, z);
  float lit = max(0.0, dot(n, normalize(vec3(0.15, 0.85, 0.5))));
  vec3 sphere = uBg * 0.4 + vec3(0.1, 0.1, 0.115) * lit * lit + uGlow * pow(1.0 - z, 4.0) * 0.18;
  col = mix(col, sphere, inside);

  // ---- accretion disk -----------------------------------------------------
  float rin = Rh * 1.55;
  if (r < uDiskRadius * 1.6) {
    float theta = atan(q.y, q.x);
    float om = 0.5 * uShear * pow(max(r, rin) / 0.3, -1.5) + 0.05;
    float th = theta + t * om;
    vec2 a2 = vec2(cos(th), sin(th));
    float lr = log(max(r, 1e-4));

    float arm = sin(2.0 * theta - t * 0.08 + 6.5 * lr);
    float w1 = noise3(vec3(a2 * 1.3, lr * 2.0 + 3.1));
    float w2 = noise3(vec3(a2 * 4.0, lr * 7.0 - 1.7));
    float rr = r * (1.0 + 0.035 * (w1 - 0.5) + 0.012 * arm) + 0.004 * (w2 - 0.5);

    float x1 = rr * uDensity;
    float x2 = rr * uDensity * 1.618 + 0.7 * w2;
    float x3 = rr * uDensity * 0.47 + 0.3 * w1;
    float dash1 = smoothstep(0.3, 0.62, noise3(vec3(a2 * 2.2, r * uDensity * 0.09)));
    float dash2 = smoothstep(0.36, 0.7, noise3(vec3(a2 * 4.5, r * uDensity * 0.14 + 9.0)));
    float s = lines(x1, 0.2) * dash1
            + 0.6 * lines(x2, 0.14) * dash2
            + 0.25 * lines(x3, 0.18) * (0.4 + 0.6 * dash2);

    // Where the crimson bands fall: a slow radial ripple plus the arms.
    float band = noise3(vec3(a2 * 1.7, r * 6.0 + 11.0)) + 0.16 * arm;
    float prof = smoothstep(0.1, 0.3, r) * (1.0 - smoothstep(0.95, 1.5, r / uDiskRadius * 1.35));
    float red = smoothstep(0.62 - 0.4 * uCrimson, 0.72 - 0.4 * uCrimson, band) * (0.25 + 0.75 * prof);

    float hot = exp(-(r - rin) / (Rh * 2.2));
    vec3 lineCol = mix(uStreak * 0.5, uDisk * 1.55, red);
    lineCol = mix(lineCol, uStreak * 1.4 + uGlow * 0.3, clamp(hot, 0.0, 1.0));

    float edge = smoothstep(rin, rin * 1.18, r) * (1.0 - smoothstep(uDiskRadius * 0.55, uDiskRadius, r));
    float bright = edge * (0.3 + 1.25 * exp(-(r - rin) * 1.9) + 1.6 * hot);
    float dop = 1.0 - uDoppler * (q.x / max(r, 1e-4));

    vec3 disk = lineCol * s * bright * dop;
    // Faint gas between the lines: crimson, cooling to navy at the inner edge.
    disk += (uDisk * 0.035 * (0.3 + red) + vec3(0.02, 0.03, 0.08) * hot) * edge * dop;
    disk *= 1.0 + 0.6 * uFeed;

    // The far half of the disk passes behind the horizon.
    float far = smoothstep(-0.25 * px, 1.5 * px, pr.y);
    col += disk * (1.0 - inside * far);
  }

  // ---- photon crown, ring and flare ---------------------------------------
  float outside = 1.0 - inside;
  float fl = uFlare * (1.0 + 1.3 * uFeed);
  float up = dot(dir, normalize(vec2(sa * 0.6, 1.0)));
  float ring = exp(-pow((d - Rh * 1.02) / (Rh * 0.035), 2.0)) * (0.55 + 0.9 * smoothstep(-0.4, 1.0, up));
  float crown = exp(-pow((d - Rh * 1.14) / (Rh * 0.09), 2.0)) * smoothstep(-0.05, 0.7, dir.y * ca - dir.x * sa);
  float halo = exp(-max(d - Rh, 0.0) / (Rh * 0.7)) * (0.35 + 0.65 * smoothstep(-0.3, 1.0, up));
  float rays = noise3(vec3(dir * 7.0, t * 0.06 + uClock * 0.02));
  rays = pow(rays, 3.0) * 1.6 * exp(-max(d - Rh, 0.0) / (Rh * 1.7)) * smoothstep(0.25, 1.0, up);
  float plane = exp(-abs(pr.y) / (Rh * 0.12)) * exp(-abs(pr.x) / (Rh * 2.6)) * smoothstep(Rh * 0.6, Rh * 1.3, abs(pr.x));
  float jet = exp(-abs(dot(p, vec2(ca, -sa))) / (Rh * 0.22)) * exp(-max(dot(p, vec2(sa, ca)), 0.0) / (Rh * 7.0))
            * step(0.0, dot(p, vec2(sa, ca)));
  col += uGlow * fl * (ring * 1.3 + crown * 0.9 + (halo * 0.8 + rays * 0.7 + jet * 0.07) * outside + plane * 0.9);

  // ---- foreground nebula, over the disk -----------------------------------
  if (uClouds > 0.0) {
    float maskB = smoothstep(0.0, 0.3, -pr.y - 0.3 * pr.x - 0.03);
    if (maskB > 0.0) {
      vec4 b = bank(uv * 0.85 + uParallax * 0.05 + vec2(7.0 - t * 0.006, 2.0), maskB, t + 40.0, toHole, px);
      col = mix(col, b.rgb, b.a);
    }
  }

  // ---- film ---------------------------------------------------------------
  col = 1.0 - exp(-col * uExposure);
  vec2 vq = uv / vec2(aspect, 1.0);
  col *= mix(1.0, smoothstep(0.95, 0.2, length(vq * vec2(1.25, 1.05))), uVignette);

  float f = floor(uClock * 24.0);
  float g1 = hash12(frag + f * vec2(37.1, 91.7));
  float g2 = hash12(floor(frag / 2.0) + f * vec2(13.3, 7.9));
  float grain = (g1 - 0.5) * 0.8 + (g2 - 0.5) * 0.55;
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col += grain * uGrain * (0.045 + 0.4 * luma * (1.0 - luma));
  // Rare dust flecks.
  float fleck = step(0.99965, hash12(floor(frag / 2.0) + f * 3.1));
  col += fleck * uGrain * 0.12;

  outColor = vec4(max(col, 0.0), 1.0);
}`;

  function compile(type, s) {
    var sh = gl.createShader(type); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error("space-bg:", gl.getShaderInfoLog(sh)); return null; }
    return sh;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); root.classList.add("no-space-gl"); return; }
  var program = gl.createProgram();
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.remove(); root.classList.add("no-space-gl"); return; }
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());

  function hex(h) { h = h.replace("#", ""); var n = parseInt(h, 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  var loc = function (n) { return gl.getUniformLocation(program, n); };
  var COLORS = [["uDisk", "diskColor"], ["uStreak", "streakColor"], ["uGlow", "glowColor"], ["uCloud", "cloudColor"], ["uBg", "background"]];
  var FLOATS = [["uHole", "holeSize"], ["uAngle", "angle"], ["uIncl", "inclination"], ["uDiskRadius", "diskRadius"], ["uShear", "shear"], ["uDensity", "streakDensity"], ["uCrimson", "crimson"], ["uDoppler", "doppler"], ["uFlare", "flare"], ["uLensing", "lensing"], ["uClouds", "clouds"], ["uCloudLines", "cloudLines"], ["uStars", "stars"], ["uGrain", "grain"], ["uVignette", "vignette"], ["uExposure", "exposure"]];
  // Static uniforms are set once.
  COLORS.forEach(function (c) { var v = hex(P[c[1]]); gl.uniform3f(loc(c[0]), v[0], v[1], v[2]); });
  FLOATS.forEach(function (f) { gl.uniform1f(loc(f[0]), P[f[1]]); });
  gl.uniform2f(loc("uCenter"), P.center[0], P.center[1]);
  var U = { res: loc("uRes"), time: loc("uTime"), clock: loc("uClock"), feed: loc("uFeed"), par: loc("uParallax") };

  var media = matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = media.matches;
  var quality = 1;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * quality;
    var w = Math.max(1, Math.floor(canvas.clientWidth * dpr)), h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  var time = 7.3, clock = 0, feed = 0, feeding = false, par = [0, 0], target = null, lastPointer = -Infinity;
  var approach = function (c, t, dt, rate) { return c + (t - c) * (1 - Math.exp(-Math.max(dt, 0) * rate)); };
  var idleDrift = function (t) { return [0.45 * Math.sin(t * 0.13) + 0.15 * Math.sin(t * 0.31 + 1.7), 0.3 * Math.sin(t * 0.17 + 0.6)]; };

  function draw() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, time); gl.uniform1f(U.clock, clock); gl.uniform1f(U.feed, feed);
    gl.uniform2f(U.par, par[0], par[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  var INTERACTIVE = "a,button,input,textarea,select,label,summary,[role=button],[contenteditable],img,article,.lightbox";
  window.addEventListener("pointermove", function (e) {
    var w = Math.max(innerWidth, 1), h = Math.max(innerHeight, 1);
    target = [Math.max(-1, Math.min(1, e.clientX / w * 2 - 1)), Math.max(-1, Math.min(1, 1 - e.clientY / h * 2))];
    lastPointer = clock;
  }, { passive: true });
  document.addEventListener("pointerleave", function () { target = null; feeding = false; });
  window.addEventListener("pointerdown", function (e) {
    var el = e.target;
    if (e.button !== 0 || (el && el.closest && el.closest(INTERACTIVE))) return;
    feeding = true;
  });
  window.addEventListener("pointerup", function () { feeding = false; });
  window.addEventListener("pointercancel", function () { feeding = false; });

  var raf = 0, visible = false, last = performance.now(), slow = 0, sampled = 0;
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    var raw = now - last, dt = Math.min(raw / 1000, 0.05);
    last = now;
    feed = approach(feed, feeding ? 1 : 0, dt, feeding ? 1.6 : 0.9);
    clock += dt;
    time += dt * P.speed * (1 + 2.6 * feed);
    var goal = target && clock - lastPointer <= 4 ? target : idleDrift(clock);
    par = [approach(par[0], goal[0], dt, 2.2), approach(par[1], goal[1], dt, 2.2)];
    // Adaptive resolution: a run of long frames lowers the buffer scale.
    if (sampled < 360 && raw < 250) {
      sampled++; if (raw > 28) slow++;
      if (sampled % 60 === 0) { if (slow > 30 && quality > 0.4) { quality *= 0.8; resize(); } slow = 0; }
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    resize();
    if (reduced) { draw(); return; }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  function syncTheme() { visible = root.classList.contains("dark") && !root.classList.contains("hg-lock"); if (visible) start(); else stop(); }
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", function () { if (visible) { resize(); if (reduced) draw(); } });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && visible) start(); else stop(); });
  if (media.addEventListener) media.addEventListener("change", function () { reduced = media.matches; stop(); if (visible) start(); });
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); });
  syncTheme();
})();
