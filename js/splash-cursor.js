/* Fluid ink cursor: a plain JavaScript port of the "SplashCursor" WebGL2 fluid simulation.
   Colours follow the portfolio: the cyan accent, a sky blue and the soft green.
   It sits above the page with pointer-events:none, so it never blocks clicks.
   Skipped for visitors who prefer reduced motion and on touch-only devices. */
(function () {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(any-pointer: fine)").matches) return;

  var root = document.documentElement;
  var S = {
    palette: ["#55dde0", "#4f8cff", "#8fcb9b"].map(parseColor),
    colorSpeed: 0.6, intensity: 0.75, size: 0.9, force: 1, swirl: 3,
    trail: 0.8, momentum: 1, shading: 1, glow: 0.25, quality: "medium", clickSplash: true
  };
  var QUALITY = { low: { sim: 64, dye: 512, iterations: 10 }, medium: { sim: 96, dye: 1024, iterations: 16 }, high: { sim: 128, dye: 1440, iterations: 20 } };
  var BLOOM_RESOLUTION = 256, BLOOM_ITERATIONS = 4, BLOOM_THRESHOLD = 0.3, BLOOM_KNEE = 0.7;
  var isLight = function () { return !root.classList.contains("dark"); };

  function parseColor(v) {
    var hex = String(v).replace("#", "").trim();
    if (hex.length === 3) hex = hex.split("").map(function (c) { return c + c; }).join("");
    var n = parseInt(hex.slice(0, 6), 16);
    return isNaN(n) ? [1, 1, 1] : [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var wrap = document.createElement("div");
  wrap.className = "splash-cursor";
  wrap.setAttribute("aria-hidden", "true");
  var canvas = document.createElement("canvas");
  canvas.className = "splash-cursor__canvas";
  wrap.appendChild(canvas);
  document.body.appendChild(wrap);

  var gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl) { wrap.remove(); return; }
  gl.getExtension("EXT_color_buffer_float");
  gl.getExtension("EXT_color_buffer_half_float");

  var VERTEX = "#version 300 es\nprecision highp float;\nin vec2 aPosition;\nuniform vec2 texelSize;\nout vec2 vUv;\nout vec2 vL;\nout vec2 vR;\nout vec2 vT;\nout vec2 vB;\nvoid main() {\n  vUv = aPosition * 0.5 + 0.5;\n  vL = vUv - vec2(texelSize.x, 0.0);\n  vR = vUv + vec2(texelSize.x, 0.0);\n  vT = vUv + vec2(0.0, texelSize.y);\n  vB = vUv - vec2(0.0, texelSize.y);\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n}";
  var HEADER = "#version 300 es\nprecision highp float;\nprecision highp sampler2D;\nin vec2 vUv;\nin vec2 vL;\nin vec2 vR;\nin vec2 vT;\nin vec2 vB;\nout vec4 outColor;\n";
  var SHADERS = {
    copy: "uniform sampler2D uTexture;\nvoid main() { outColor = texture(uTexture, vUv); }",
    clear: "uniform sampler2D uTexture;\nuniform float value;\nvoid main() { outColor = value * texture(uTexture, vUv); }",
    splat: "uniform sampler2D uTarget;\nuniform float aspectRatio;\nuniform vec3 color;\nuniform vec2 pointA;\nuniform vec2 pointB;\nuniform float radius;\nvoid main() {\n  vec2 scale = vec2(aspectRatio, 1.0);\n  vec2 pa = (vUv - pointA) * scale;\n  vec2 ba = (pointB - pointA) * scale;\n  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-9), 0.0, 1.0);\n  vec2 d = pa - ba * h;\n  vec3 base = texture(uTarget, vUv).xyz;\n  outColor = vec4(base + exp(-dot(d, d) / radius) * color, 1.0);\n}",
    burst: "uniform sampler2D uTarget;\nuniform float aspectRatio;\nuniform vec2 point;\nuniform float radius;\nuniform float strength;\nuniform float seed;\nvoid main() {\n  vec2 d = (vUv - point) * vec2(aspectRatio, 1.0);\n  float distance = length(d);\n  vec2 direction = d / max(distance, 0.00001);\n  float angle = atan(d.y, d.x);\n  float petals = 0.78 + 0.22 * sin(angle * 5.0 + seed) * sin(angle * 3.0 - seed * 1.7);\n  vec2 twist = vec2(-direction.y, direction.x) * 0.3 * sin(angle * 4.0 + seed * 2.3);\n  float falloff = exp(-dot(d, d) / radius) * distance / sqrt(radius);\n  outColor = vec4(texture(uTarget, vUv).xy + (direction * petals + twist) * falloff * strength, 0.0, 1.0);\n}",
    crown: "uniform sampler2D uTarget;\nuniform float aspectRatio;\nuniform vec2 point;\nuniform float radius;\nuniform vec3 colorA;\nuniform vec3 colorB;\nuniform float seed;\nvoid main() {\n  vec2 d = (vUv - point) * vec2(aspectRatio, 1.0);\n  vec3 ink = exp(-dot(d, d) / (radius * 0.45)) * colorA;\n  for (int i = 0; i < 7; i++) {\n    float index = float(i);\n    float angle = seed + index * 0.8975979 + sin(seed * 3.0 + index * 1.9) * 0.35;\n    float reach = sqrt(radius) * (0.75 + 0.45 * fract(sin(seed * 7.1 + index * 3.7) * 43.7));\n    float drop = radius * (0.08 + 0.12 * fract(sin(seed * 2.9 + index * 5.3) * 31.9));\n    vec2 q = d - vec2(cos(angle), sin(angle)) * reach;\n    ink += exp(-dot(q, q) / drop) * mix(colorA, colorB, fract(index * 0.37 + 0.2));\n  }\n  outColor = vec4(texture(uTarget, vUv).xyz + ink, 1.0);\n}",
    advection: "uniform sampler2D uVelocity;\nuniform sampler2D uSource;\nuniform vec2 texelSize;\nuniform float dt;\nuniform float dissipation;\nvoid main() {\n  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;\n  outColor = texture(uSource, coord) / (1.0 + dissipation * dt);\n}",
    divergence: "uniform sampler2D uVelocity;\nvoid main() {\n  float L = texture(uVelocity, vL).x;\n  float R = texture(uVelocity, vR).x;\n  float T = texture(uVelocity, vT).y;\n  float B = texture(uVelocity, vB).y;\n  vec2 C = texture(uVelocity, vUv).xy;\n  if (vL.x < 0.0) L = -C.x;\n  if (vR.x > 1.0) R = -C.x;\n  if (vT.y > 1.0) T = -C.y;\n  if (vB.y < 0.0) B = -C.y;\n  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);\n}",
    curl: "uniform sampler2D uVelocity;\nvoid main() {\n  float L = texture(uVelocity, vL).y;\n  float R = texture(uVelocity, vR).y;\n  float T = texture(uVelocity, vT).x;\n  float B = texture(uVelocity, vB).x;\n  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);\n}",
    vorticity: "uniform sampler2D uVelocity;\nuniform sampler2D uCurl;\nuniform float curl;\nuniform float dt;\nvoid main() {\n  float L = texture(uCurl, vL).x;\n  float R = texture(uCurl, vR).x;\n  float T = texture(uCurl, vT).x;\n  float B = texture(uCurl, vB).x;\n  float C = texture(uCurl, vUv).x;\n  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));\n  force /= length(force) + 0.0001;\n  force *= curl * C;\n  force.y *= -1.0;\n  vec2 velocity = texture(uVelocity, vUv).xy + force * dt;\n  outColor = vec4(clamp(velocity, -1000.0, 1000.0), 0.0, 1.0);\n}",
    pressure: "uniform sampler2D uPressure;\nuniform sampler2D uDivergence;\nvoid main() {\n  float L = texture(uPressure, vL).x;\n  float R = texture(uPressure, vR).x;\n  float T = texture(uPressure, vT).x;\n  float B = texture(uPressure, vB).x;\n  float divergence = texture(uDivergence, vUv).x;\n  outColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);\n}",
    gradient: "uniform sampler2D uPressure;\nuniform sampler2D uVelocity;\nvoid main() {\n  float L = texture(uPressure, vL).x;\n  float R = texture(uPressure, vR).x;\n  float T = texture(uPressure, vT).x;\n  float B = texture(uPressure, vB).x;\n  vec2 velocity = texture(uVelocity, vUv).xy - vec2(R - L, T - B);\n  outColor = vec4(velocity, 0.0, 1.0);\n}",
    prefilter: "uniform sampler2D uTexture;\nuniform vec3 curve;\nuniform float threshold;\nvoid main() {\n  vec3 c = texture(uTexture, vUv).rgb;\n  float br = max(c.r, max(c.g, c.b));\n  float rq = clamp(br - curve.x, 0.0, curve.y);\n  rq = curve.z * rq * rq;\n  c *= max(rq, br - threshold) / max(br, 0.0001);\n  outColor = vec4(c, 0.0);\n}",
    blur: "uniform sampler2D uTexture;\nuniform float intensity;\nvoid main() {\n  vec4 sum = texture(uTexture, vL) + texture(uTexture, vR) + texture(uTexture, vT) + texture(uTexture, vB);\n  outColor = sum * 0.25 * intensity;\n}",
    display: "uniform sampler2D uTexture;\nuniform sampler2D uBloom;\nuniform vec2 texelSize;\nuniform float shading;\nuniform float bloom;\nuniform float light;\nfloat hash(vec2 p) {\n  vec3 q = fract(vec3(p.xyx) * 0.1031);\n  q += dot(q, q.yzx + 33.33);\n  return fract((q.x + q.y) * q.z);\n}\nvoid main() {\n  vec3 c = texture(uTexture, vUv).rgb;\n  if (shading > 0.0) {\n    float dx = length(texture(uTexture, vR).rgb) - length(texture(uTexture, vL).rgb);\n    float dy = length(texture(uTexture, vT).rgb) - length(texture(uTexture, vB).rgb);\n    vec3 n = normalize(vec3(dx, dy, length(texelSize)));\n    c *= mix(1.0, clamp(n.z + 0.7, 0.7, 1.0), shading);\n  }\n  if (bloom > 0.0) { c += max(texture(uBloom, vUv).rgb, 0.0) * bloom; }\n  c = max(c, 0.0);\n  float peak = max(c.r, max(c.g, c.b));\n  float grain = (hash(gl_FragCoord.xy) - 0.5) / 255.0 * smoothstep(0.0, 0.03, peak);\n  if (light > 0.5) {\n    vec3 transmit = exp(-2.4 * c);\n    float low = min(transmit.r, min(transmit.g, transmit.b));\n    float alpha = clamp(1.0 - low + grain, 0.0, 1.0);\n    outColor = vec4(min(transmit - low, vec3(alpha)), alpha);\n  } else {\n    c = max(c + grain, 0.0);\n    float alpha = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);\n    outColor = vec4(min(c, vec3(alpha)), alpha);\n  }\n}"
  };

  function renderable(internal, format) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, gl.HALF_FLOAT, null);
    var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(f); gl.deleteTexture(t);
    return ok;
  }
  var rgba = { internal: gl.RGBA16F, format: gl.RGBA };
  if (!renderable(rgba.internal, rgba.format)) { wrap.remove(); return; }
  var rg = renderable(gl.RG16F, gl.RG) ? { internal: gl.RG16F, format: gl.RG } : rgba;
  var r1 = renderable(gl.R16F, gl.RED) ? { internal: gl.R16F, format: gl.RED } : rg;

  function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var vs = compile(gl.VERTEX_SHADER, VERTEX), programs = {}, broken = false;
  Object.keys(SHADERS).forEach(function (name) {
    var fs = compile(gl.FRAGMENT_SHADER, HEADER + SHADERS[name]);
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.bindAttribLocation(p, 0, "aPosition"); gl.linkProgram(p); gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) broken = true;
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); if (info) u[info.name] = gl.getUniformLocation(p, info.name); }
    programs[name] = { program: p, uniforms: u };
  });
  gl.deleteShader(vs);
  if (broken) { wrap.remove(); return; }

  var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  var use = function (name) { gl.useProgram(programs[name].program); return programs[name].uniforms; };
  function blit(target) {
    if (target) { gl.viewport(0, 0, target.width, target.height); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function createTarget(w, h, fmt, filter) {
    gl.activeTexture(gl.TEXTURE0);
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, w, h, 0, fmt.format, gl.HALF_FLOAT, null);
    var fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture: tex, fbo: fbo, width: w, height: h, texelX: 1 / w, texelY: 1 / h,
      attach: function (unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; } };
  }
  function destroyTarget(t) { if (!t) return; gl.deleteFramebuffer(t.fbo); gl.deleteTexture(t.texture); }
  function reshape(t, w, h, fmt) {
    gl.bindTexture(gl.TEXTURE_2D, t.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, w, h, 0, fmt.format, gl.HALF_FLOAT, null);
    t.width = w; t.height = h; t.texelX = 1 / w; t.texelY = 1 / h;
  }
  function createDouble(w, h, fmt, filter) {
    var pair = { read: createTarget(w, h, fmt, filter), write: createTarget(w, h, fmt, filter), width: w, height: h, texelX: 1 / w, texelY: 1 / h };
    pair.swap = function () { var c = pair.read; pair.read = pair.write; pair.write = c; };
    return pair;
  }
  function resizeDouble(pair, w, h, fmt, filter, keep) {
    if (keep) {
      var next = createTarget(w, h, fmt, filter), u = use("copy");
      gl.uniform1i(u.uTexture, pair.read.attach(0)); blit(next); destroyTarget(pair.read); pair.read = next;
    } else reshape(pair.read, w, h, fmt);
    reshape(pair.write, w, h, fmt);
    pair.width = w; pair.height = h; pair.texelX = 1 / w; pair.texelY = 1 / h;
  }
  function resolution(base) {
    var w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    var aspect = Math.max(w, h) / Math.max(1, Math.min(w, h)), s = Math.round(base), l = Math.round(base * aspect);
    return w > h ? { width: l, height: s } : { width: s, height: l };
  }
  function fit() {
    var ratio = Math.min(devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.floor(canvas.clientWidth * ratio)), h = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function sizes() {
    var q = QUALITY[S.quality], shortSide = Math.min(gl.drawingBufferWidth, gl.drawingBufferHeight);
    return { sim: resolution(q.sim), ink: resolution(Math.max(q.sim, Math.min(q.dye, shortSide))) };
  }

  fit();
  var init = sizes();
  var dye = createDouble(init.ink.width, init.ink.height, rgba, gl.LINEAR);
  var velocity = createDouble(init.sim.width, init.sim.height, rg, gl.LINEAR);
  var pressure = createDouble(init.sim.width, init.sim.height, r1, gl.NEAREST);
  var divergence = createTarget(init.sim.width, init.sim.height, r1, gl.NEAREST);
  var curl = createTarget(init.sim.width, init.sim.height, r1, gl.NEAREST);
  var bloom = null, bloomChain = [];
  function dropBloom() { destroyTarget(bloom); bloomChain.forEach(destroyTarget); bloom = null; bloomChain = []; }
  function ensureBloom() {
    if (bloom) return bloom;
    var sz = resolution(BLOOM_RESOLUTION), created = createTarget(sz.width, sz.height, rgba, gl.LINEAR);
    for (var i = 0; i < BLOOM_ITERATIONS; i++) {
      var w = sz.width >> (i + 1), h = sz.height >> (i + 1);
      if (w < 2 || h < 2) break;
      bloomChain.push(createTarget(w, h, rgba, gl.LINEAR));
    }
    bloom = created; return created;
  }
  function resize() {
    fit();
    var next = sizes();
    if (dye.width !== next.ink.width || dye.height !== next.ink.height) resizeDouble(dye, next.ink.width, next.ink.height, rgba, gl.LINEAR, true);
    if (velocity.width !== next.sim.width || velocity.height !== next.sim.height) {
      resizeDouble(velocity, next.sim.width, next.sim.height, rg, gl.LINEAR, true);
      resizeDouble(pressure, next.sim.width, next.sim.height, r1, gl.NEAREST, false);
      reshape(divergence, next.sim.width, next.sim.height, r1);
      reshape(curl, next.sim.width, next.sim.height, r1);
    }
    var gs = resolution(BLOOM_RESOLUTION);
    if (bloom && (bloom.width !== gs.width || bloom.height !== gs.height)) dropBloom();
  }
  function radiusFor(scale) { var a = canvas.width / canvas.height; return ((0.2 * S.size * scale) / 100) * (a > 1 ? a : 1); }
  function splat(ax, ay, bx, by, vx, vy, color, radius) {
    var u = use("splat");
    gl.uniform1i(u.uTarget, velocity.read.attach(0)); gl.uniform1f(u.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(u.pointA, ax, ay); gl.uniform2f(u.pointB, bx, by); gl.uniform3f(u.color, vx, vy, 0); gl.uniform1f(u.radius, radius);
    blit(velocity.write); velocity.swap();
    gl.uniform1i(u.uTarget, dye.read.attach(0)); gl.uniform3f(u.color, color[0], color[1], color[2]);
    blit(dye.write); dye.swap();
  }
  function colorAt(offset, now) {
    var phase = (((offset + (now / 1000) * S.colorSpeed * 0.6) % 1) + 1) % 1, pal = S.palette;
    var pos = phase * pal.length, from = pal[Math.floor(pos) % pal.length], to = pal[(Math.floor(pos) + 1) % pal.length];
    var t = pos - Math.floor(pos), b = t * t * (3 - 2 * t);
    return [from[0] + (to[0] - from[0]) * b, from[1] + (to[1] - from[1]) * b, from[2] + (to[2] - from[2]) * b];
  }
  function inkFor(color, amount) { var l = isLight(); return color.map(function (c) { return (l ? 1 - c : c) * amount; }); }
  function flush(p, dt, now) {
    var aspect = canvas.width / canvas.height, len = Math.hypot((p.x - p.px) * aspect, p.y - p.py);
    if (len > 0.35) { p.px = p.x; p.py = p.y; return; }
    var dx = p.x - p.px, dy = p.y - p.py;
    if (aspect < 1) dx *= aspect; else dy /= aspect;
    var radius = radiusFor(1), spread = 1 + len / (1.77 * Math.sqrt(radius));
    var push = (6000 * S.force) / Math.sqrt(spread), amount = (0.15 * S.intensity * Math.min(dt * 60, 1)) / Math.sqrt(spread);
    splat(p.px, p.py, p.x, p.y, dx * push, dy * push, inkFor(colorAt(p.offset, now), amount), radius);
    p.px = p.x; p.py = p.y;
  }
  function burst(x, y, now) {
    var seed = Math.random() * Math.PI * 2, aspect = canvas.width / canvas.height;
    var u = use("burst");
    gl.uniform1i(u.uTarget, velocity.read.attach(0)); gl.uniform1f(u.aspectRatio, aspect); gl.uniform2f(u.point, x, y);
    gl.uniform1f(u.radius, radiusFor(3)); gl.uniform1f(u.strength, 1100 * S.force); gl.uniform1f(u.seed, seed);
    blit(velocity.write); velocity.swap();
    var off = Math.random(), amount = 1.6 * S.intensity, a = inkFor(colorAt(off, now), amount), b = inkFor(colorAt(off + 0.3, now), amount);
    u = use("crown");
    gl.uniform1i(u.uTarget, dye.read.attach(0)); gl.uniform1f(u.aspectRatio, aspect); gl.uniform2f(u.point, x, y);
    gl.uniform1f(u.radius, radiusFor(1.6)); gl.uniform3f(u.colorA, a[0], a[1], a[2]); gl.uniform3f(u.colorB, b[0], b[1], b[2]); gl.uniform1f(u.seed, seed);
    blit(dye.write); dye.swap();
  }
  function step(dt) {
    var iters = QUALITY[S.quality].iterations, u;
    gl.disable(gl.BLEND);
    u = use("curl"); gl.uniform2f(u.texelSize, velocity.texelX, velocity.texelY); gl.uniform1i(u.uVelocity, velocity.read.attach(0)); blit(curl);
    u = use("vorticity"); gl.uniform2f(u.texelSize, velocity.texelX, velocity.texelY); gl.uniform1i(u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(u.uCurl, curl.attach(1)); gl.uniform1f(u.curl, S.swirl); gl.uniform1f(u.dt, dt); blit(velocity.write); velocity.swap();
    u = use("divergence"); gl.uniform2f(u.texelSize, velocity.texelX, velocity.texelY); gl.uniform1i(u.uVelocity, velocity.read.attach(0)); blit(divergence);
    u = use("clear"); gl.uniform1i(u.uTexture, pressure.read.attach(0)); gl.uniform1f(u.value, 0.1); blit(pressure.write); pressure.swap();
    u = use("pressure"); gl.uniform2f(u.texelSize, velocity.texelX, velocity.texelY); gl.uniform1i(u.uDivergence, divergence.attach(0));
    for (var i = 0; i < iters; i++) { gl.uniform1i(u.uPressure, pressure.read.attach(1)); blit(pressure.write); pressure.swap(); }
    u = use("gradient"); gl.uniform2f(u.texelSize, velocity.texelX, velocity.texelY); gl.uniform1i(u.uPressure, pressure.read.attach(0));
    gl.uniform1i(u.uVelocity, velocity.read.attach(1)); blit(velocity.write); velocity.swap();
    u = use("advection"); gl.uniform2f(u.texelSize, velocity.texelX, velocity.texelY); gl.uniform1i(u.uVelocity, velocity.read.attach(0));
    gl.uniform1i(u.uSource, velocity.read.attach(0)); gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, 2 / S.momentum); blit(velocity.write); velocity.swap();
    gl.uniform1i(u.uVelocity, velocity.read.attach(0)); gl.uniform1i(u.uSource, dye.read.attach(1)); gl.uniform1f(u.dissipation, 3.5 / S.trail); blit(dye.write); dye.swap();
  }
  function applyBloom(amount) {
    var base = ensureBloom();
    if (!bloomChain.length) return;
    gl.disable(gl.BLEND);
    var u = use("prefilter"), knee = BLOOM_THRESHOLD * BLOOM_KNEE + 0.0001;
    gl.uniform3f(u.curve, BLOOM_THRESHOLD - knee, knee * 2, 0.25 / knee); gl.uniform1f(u.threshold, BLOOM_THRESHOLD);
    gl.uniform1i(u.uTexture, dye.read.attach(0)); blit(base);
    u = use("blur"); gl.uniform1f(u.intensity, 1);
    var last = base;
    bloomChain.forEach(function (t) { gl.uniform2f(u.texelSize, last.texelX, last.texelY); gl.uniform1i(u.uTexture, last.attach(0)); blit(t); last = t; });
    gl.blendFunc(gl.ONE, gl.ONE); gl.enable(gl.BLEND);
    for (var i = bloomChain.length - 2; i >= 0; i--) { var t = bloomChain[i]; gl.uniform2f(u.texelSize, last.texelX, last.texelY); gl.uniform1i(u.uTexture, last.attach(0)); blit(t); last = t; }
    gl.disable(gl.BLEND);
    gl.uniform1f(u.intensity, amount); gl.uniform2f(u.texelSize, last.texelX, last.texelY); gl.uniform1i(u.uTexture, last.attach(0)); blit(base);
  }
  function render() {
    var light = isLight();
    if (S.glow > 0 && !light) applyBloom(2 * S.glow);
    gl.disable(gl.BLEND);
    var u = use("display");
    gl.uniform2f(u.texelSize, 1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
    gl.uniform1i(u.uTexture, dye.read.attach(0)); gl.uniform1i(u.uBloom, (bloom || dye.read).attach(1));
    gl.uniform1f(u.shading, S.shading); gl.uniform1f(u.bloom, S.glow > 0 && !light && bloom ? 1 : 0); gl.uniform1f(u.light, light ? 1 : 0);
    blit(null);
  }
  function clearScreen() { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }

  var pointer = { x: 0, y: 0, px: 0, py: 0, ready: false, moved: false, offset: Math.random() };
  var bursts = [], raf = 0, last = 0, lastActivity = performance.now(), lost = false;
  function frame(now) {
    raf = 0;
    if (lost) return;
    var dt = clamp((now - last) / 1000, 0, 1 / 60);
    last = now;
    resize();
    if (pointer.moved) { pointer.moved = false; flush(pointer, dt, now); }
    bursts.splice(0).forEach(function (p) { burst(p.x, p.y, now); });
    step(dt); render();
    if (now - lastActivity < (2.2 * S.trail + 0.4) * 1000) raf = requestAnimationFrame(frame);
    else clearScreen();
  }
  function wake() { lastActivity = performance.now(); if (raf || lost) return; last = performance.now(); raf = requestAnimationFrame(frame); }
  function locate(cx, cy) { return { x: cx / Math.max(innerWidth, 1), y: 1 - cy / Math.max(innerHeight, 1) }; }

  window.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    var p = locate(e.clientX, e.clientY);
    if (!pointer.ready) { pointer.x = pointer.px = p.x; pointer.y = pointer.py = p.y; pointer.ready = true; return; }
    pointer.x = p.x; pointer.y = p.y; pointer.moved = true; wake();
  }, { passive: true });
  window.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch" || !S.clickSplash) return;
    bursts.push(locate(e.clientX, e.clientY)); wake();
  }, { passive: true });
  root.addEventListener("pointerleave", function () { pointer.ready = false; });
  document.addEventListener("visibilitychange", function () { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } });
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); lost = true; cancelAnimationFrame(raf); raf = 0; });
  resize();
})();
