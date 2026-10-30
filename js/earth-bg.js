/* Earth horizon background: a vanilla port of the "Earth Blaze" WebGL scene.
   Shown behind every page in dark mode. NASA Blue Marble texture (public domain), served locally. */
(function () {
  "use strict";
  var TEXTURE = "images/earth-texture.jpg";
  var STAR_COUNT = 1800, GALAXY = 1, SURFACE = 1, ILLUMINATION = 1;
  var root = document.documentElement;

  var canvas = document.createElement("canvas");
  canvas.id = "earthBg";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  root.classList.add("has-earth");

  var gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
  if (!gl) { canvas.remove(); root.classList.remove("has-earth"); return; }

  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var media = matchMedia("(prefers-reduced-motion: reduce)");
  var still = function () { return media.matches; };
  var geometry = null, visible = true, ready = false;
  var program, stars, buffer, starBuffer, texture, cosmos, U, SU, position, starPosition, starTail;
  var state = { angle: 0, target: 0, reveal: 0, targetReveal: 0, clock: 0, drift: [0, 0], targetDrift: [0, 0], frame: 0, last: 0 };

  var vertex = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0., 1.); }
  `;
  var fragment = `
    precision highp float;
    uniform vec2 resolution;
    uniform vec2 center;
    uniform float radius;
    uniform float angle;
    uniform float reveal;
    uniform float galaxyBrightness;
    uniform float surfaceBrightness;
    uniform vec4 auroraColor;
    uniform vec4 backgroundColor;
    uniform float illumination;
    uniform float auroraPreview;
    uniform float viewAngle;
    uniform float clock;
    uniform float charge;
    uniform float pulse;
    uniform float pulseAngle;
    uniform float still;
    uniform vec2 drift;
    uniform sampler2D earth;
    uniform sampler2D cosmos;
    const float PI = 3.141592653589793;

    float gauss(float x, float width) { return exp(-x * x / (width * width)); }
    float grain(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(.06711056, .00583715)))); }
    mat2 rotate(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

    vec3 orientGlobe(vec2 xy) {
      vec3 n = vec3(xy.x, -xy.y, sqrt(max(0., 1. - dot(xy, xy))));
      // Keep Europe in the illuminated region on both wide and portrait screens.
      n.xy = rotate(-2.30267 - viewAngle) * n.xy;
      n.xz = rotate(2.70) * n.xz;
      n.xy = rotate(-.08) * n.xy;
      return n;
    }
    vec2 geography(vec3 n) {
      return vec2(atan(-n.z, n.x), asin(clamp(n.y, -1., 1.)));
    }
    vec3 recolor(vec3 source, vec4 tint) {
      return mix(source, tint.rgb * max(source.r, max(source.g, source.b)), tint.a);
    }
    void main() {
      vec2 p = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) / resolution.y;
      vec2 q = p - center;
      float distanceToCenter = length(q);
      float d = distanceToCenter - radius;
      float pixel = 1. / resolution.y;
      vec2 radial = vec2(cos(angle), sin(angle));
      vec2 tangent = vec2(-radial.y, radial.x);
      vec2 sun = center + radial * (radius - .007);
      vec2 delta = p - sun;
      float along = dot(delta, tangent);
      float across = dot(delta, radial);
      float angleDistance = acos(clamp(dot(q / max(distanceToCenter, .0001), radial), -1., 1.)) * radius;
      float space = smoothstep(-pixel, pixel, d);
      float inside = 1. - space;
      float verticalFade = smoothstep(.005, .13, p.y) * (1. - smoothstep(.86, 1.02, p.y));
      float rimLocal = gauss(angleDistance, .34);

      // Holding the light bends the distant nebula, while the planet stays still.
      float event = max(pulse, 0.);
      float bloom = smoothstep(0., .32, event) * (1. - smoothstep(1.4, 4.8, event)) * step(0., pulse);
      bloom = max(max(bloom, charge * still * .65), auroraPreview * .75);
      vec2 sky = p - drift * .007;
      vec2 lens = sky - sun;
      float bend = charge * exp(-dot(lens, lens) / .32) * (1. - still);
      sky = sun + rotate(-bend * .46) * lens / (1. - bend * .20);
      vec2 skyUV = vec2(sky.x / (resolution.x / resolution.y), 1. - sky.y);
      vec3 color = recolor(texture2D(cosmos, skyUV).rgb, backgroundColor) * galaxyBrightness * space * (1. + charge * .45 + bloom * .5);

      // Scattering stays on the sky side of the occluding planet.
      vec3 halo = vec3(.105, .026, .065) * gauss(along, .23) * gauss(across, .11);
      halo += vec3(.21, .066, .072) * gauss(along, .12) * gauss(across, .061);
      halo += vec3(.29, .16, .125) * gauss(along, .057) * gauss(across, .033);
      halo += vec3(.57, .48, .40) * gauss(along, .025) * gauss(across, .020);
      color += halo * illumination * space * (1. + charge * 1.4 + bloom * .65);

      // A thin cool atmosphere transitions to warm white beside the hidden sun.
      float line = gauss(d, max(.00042, pixel * .66));
      vec3 rim = mix(vec3(.105, .135, .18), vec3(.85, .64, .48), rimLocal);
      color += rim * illumination * line * verticalFade;
      color += vec3(.20, .078, .06) * illumination * gauss(d, .003) * rimLocal * verticalFade;
      color += vec3(.034, .057, .092) * illumination * exp(-max(d, 0.) / .007) * space * verticalFade * (.2 + .8 * rimLocal);

      // A released solar pulse travels along the limb and awakens auroral curtains.
      vec2 eventRadial = vec2(cos(pulseAngle), sin(pulseAngle));
      vec2 eventSun = center + eventRadial * (radius - .007);
      float eventDistance = acos(clamp(dot(q / max(distanceToCenter, .0001), eventRadial), -1., 1.)) * radius;
      float sweep = gauss(eventDistance - event * .31, .14);
      sweep = max(sweep, auroraPreview * .8);
      float curtainPhase = atan(q.y, q.x);
      float pleats = .5 + .5 * sin(curtainPhase * 185. + 3. * sin(curtainPhase * 37.) + clock * .23);
      float ceiling = .021 + .020 * sin(curtainPhase * 23. + clock * .11);
      float curtain = exp(-abs(d - ceiling) / .025) * (.25 + .75 * pleats);
      vec3 aurora = mix(vec3(.065, .54, .40), vec3(.36, .13, .59), .5 + .5 * sin(curtainPhase * 12.));
      color += recolor(aurora, auroraColor) * curtain * bloom * (.20 + sweep * .70) * verticalFade;
      color += recolor(vec3(.22, .55, .63), auroraColor) * gauss(d, .0025) * sweep * bloom * verticalFade;

      float waveRadius = .025 + event * .32;
      float wave = gauss(length(p - eventSun) - waveRadius, .010 + event * .004);
      color += recolor(mix(vec3(.20, .36, .57), vec3(.36, .16, .33), .5 + .5 * sin(atan(delta.y, delta.x) * 3.)), auroraColor) * wave * bloom * .25 * space * (1. - still);

      if (d < 0.) {
        vec3 normal = orientGlobe(q / radius);
        vec2 geo = geography(normal);
        vec2 uv = vec2(.5) + geo / vec2(2. * PI, PI);
        vec3 tex = texture2D(earth, uv).rgb;
        float depth = -d;
        float grazing = smoothstep(.002, .033, depth) * exp(-depth / .19);
        float pool = max(gauss(angleDistance, .37), bloom * gauss(eventDistance, .65)) * grazing;
        vec3 surface = mix(tex, vec3(dot(tex, vec3(.2126, .7152, .0722))), .32);
        surface *= vec3(.61, .74, 1.);
        color += surface * pool * (.045 + reveal * .24 + bloom * .20 + charge * .045) * inside * surfaceBrightness * illumination;
        color += vec3(.010, .018, .032) * pool * (reveal + bloom) * inside * surfaceBrightness * illumination;
      }

      // One static sub-byte dither prevents bands without making black space noisy.
      float light = max(color.r, max(color.g, color.b));
      color += (grain(gl_FragCoord.xy) - .5) / 255. * smoothstep(.001, .015, light);
      gl_FragColor = vec4(clamp(color, 0., 1.), 1.);
    }
  `;
  var nebulaFragment = `
    precision highp float;
    uniform vec2 resolution;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float f = 0., a = .5;
      for (int i = 0; i < 6; i++) { f += a * noise(p); p = mat2(.8, -.6, .6, .8) * p * 2.07 + 17.3; a *= .5; }
      return f;
    }
    void main() {
      vec2 uv = vec2(gl_FragCoord.x / resolution.x, 1. - gl_FragCoord.y / resolution.y);
      vec2 p = uv * vec2(2.1, 1.);
      vec2 warp = vec2(fbm(p * 3.1), fbm(p * 3.1 + 9.7));
      float gas = fbm(p * 7. + warp * 4.);
      float lace = fbm(p * 23. + warp * 7.);
      float rift = abs(uv.y - (.58 - uv.x * .65 + .065 * sin(uv.x * 7.)) + (gas - .5) * .19);
      float band = exp(-pow(rift / .15, 2.));
      float dust = smoothstep(.28, .68, fbm(p * 11. + warp * 5. + 30.));
      float clouds = pow(gas, 2.3) * (.28 + lace * 1.1) * band;
      vec3 cold = mix(vec3(.018, .13, .26), vec3(.28, .045, .16), smoothstep(.14, .80, warp.x));
      cold = mix(cold, vec3(.022, .22, .18), smoothstep(.47, .66, warp.y) * .65);
      vec3 col = cold * clouds * (1. - dust * .82) * 2.4;
      col += vec3(.08, .10, .15) * pow(lace, 4.) * band * .50;
      col += vec3(.005, .007, .014) * pow(fbm(p * 4. + 80.), 2.);
      float speck = pow(hash(gl_FragCoord.xy), 34.) * band * .029;
      col += vec3(.7, .8, 1.) * speck;
      gl_FragColor = vec4(col, 1.);
    }
  `;
  var starVertex = `
    precision highp float;
    attribute vec4 star;
    attribute float tail;
    uniform vec2 resolution;
    uniform vec2 center;
    uniform vec2 drift;
    uniform float radius;
    uniform float angle;
    uniform float charge;
    uniform float clock;
    uniform float pulse;
    uniform float pulseAngle;
    uniform float still;
    varying vec3 tint;
    varying float alpha;
    varying float sharp;
    varying vec2 location;
    mat2 rotate(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
    void main() {
      vec2 p = star.xy * vec2(resolution.x / resolution.y, 1.);
      p += drift * (.003 + star.w * .009) * (1. - still);
      vec2 sun = center + vec2(cos(angle), sin(angle)) * (radius - .007);
      vec2 delta = p - sun;
      float attraction = exp(-dot(delta, delta) / .40);
      float c = max(0., charge - tail * .026) * (1. - still);
      p = sun + rotate(c * .46 * attraction) * delta * (1. - c * .20 * attraction);
      float e = max(pulse, 0.);
      vec2 eventDelta = p - (center + vec2(cos(pulseAngle), sin(pulseAngle)) * (radius - .007));
      float impulse = exp(-pow((length(eventDelta) - e * .32) / .07, 2.)) * (1. - smoothstep(2., 4.8, e)) * step(0., pulse) * (1. - still);
      p += (eventDelta / max(length(eventDelta), .0001)) * impulse * .004;
      location = p;
      gl_Position = vec4(p.x / (resolution.x / resolution.y) * 2. - 1., 1. - p.y * 2., 0., 1.);
      sharp = step(.988, star.w);
      gl_PointSize = mix(star.z, 20. + star.w * 8., sharp) * max(1., resolution.y / 900.);
      float twinkle = .82 + .18 * sin(clock * (.45 + star.w) + star.w * 123.);
      alpha = (.24 + star.w * .58 + sharp * .55) * twinkle;
      alpha *= tail < .5 ? 1. : charge * (1. - tail / 7.) * .19 * (1. - still);
      alpha *= 1. + impulse * .8;
      tint = mix(vec3(.49, .70, 1.), vec3(1., .69, .49), smoothstep(.32, .90, fract(star.w * 13.7)));
      tint = mix(tint, vec3(.93, .77, 1.), step(.87, fract(star.w * 7.)));
    }
  `;
  var starFragment = `
    precision highp float;
    uniform vec2 center;
    uniform float radius;
    varying vec3 tint;
    varying float alpha;
    varying float sharp;
    varying vec2 location;
    void main() {
      float sky = smoothstep(.001, .004, length(location - center) - radius);
      vec2 p = gl_PointCoord - .5;
      float r = length(p);
      float ordinary = exp(-r * r * 23.);
      float core = exp(-r * r * 2100.);
      float rays = exp(-abs(p.x) * 260. - abs(p.y) * 13.) + exp(-abs(p.y) * 260. - abs(p.x) * 13.);
      float jewel = core * 2. + rays * .65 + exp(-r * r * 55.) * .035;
      gl_FragColor = vec4(tint * mix(ordinary, jewel, sharp), alpha * sky);
    }
  `;

  function compile(type, source) {
    var s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function link(v, f) {
    var p = gl.createProgram(), a = compile(gl.VERTEX_SHADER, v), b = compile(gl.FRAGMENT_SHADER, f);
    gl.attachShader(p, a); gl.attachShader(p, b); gl.linkProgram(p); gl.deleteShader(a); gl.deleteShader(b);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link failed");
    return p;
  }
  function locs(p, names) { var o = {}; names.forEach(function (k) { o[k] = gl.getUniformLocation(p, k); }); return o; }
  function texOpts() {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  function quad(p, at) { gl.useProgram(p); gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.enableVertexAttribArray(at); gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0); }

  function setup() {
    program = link(vertex, fragment);
    position = gl.getAttribLocation(program, "position");
    U = locs(program, ["resolution", "center", "radius", "angle", "reveal", "viewAngle", "earth", "cosmos", "clock", "charge", "pulse", "pulseAngle", "still", "drift", "galaxyBrightness", "surfaceBrightness", "auroraColor", "backgroundColor", "illumination", "auroraPreview"]);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    // Bake the nebula once into a texture.
    var nebula = link(vertex, nebulaFragment);
    cosmos = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, cosmos);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1536, 1024, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); texOpts();
    var fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cosmos, 0);
    quad(nebula, gl.getAttribLocation(nebula, "position")); gl.viewport(0, 0, 1536, 1024);
    gl.uniform2f(gl.getUniformLocation(nebula, "resolution"), 1536, 1024); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.deleteFramebuffer(fb); gl.deleteProgram(nebula);
    texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([5, 9, 16])); texOpts();
    stars = link(starVertex, starFragment);
    starPosition = gl.getAttribLocation(stars, "star"); starTail = gl.getAttribLocation(stars, "tail");
    SU = locs(stars, ["resolution", "center", "radius", "angle", "clock", "charge", "pulse", "pulseAngle", "still", "drift"]);
    var seed = 428731, rnd = function () { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    var data = new Float32Array(STAR_COUNT * 35), at = 0;
    for (var i = 0; i < STAR_COUNT; i++) {
      var x = rnd(), y = rnd(), size = 1 + Math.pow(rnd(), 2.4) * 2.6, id = rnd();
      for (var t = 0; t < 7; t++) { data.set([x, y, size, id, t], at); at += 5; }
    }
    starBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    ready = true;
    var img = new Image();
    img.onload = function () {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); requestFrame();
    };
    img.src = TEXTURE;
  }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) { stop(); return; }
    var aspect = w / h, dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(3000000 / (w * h)));
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    var p = [.15 * aspect, .91], q = [.88 * aspect, .015];
    var vx = q[0] - p[0], vy = q[1] - p[1], len = Math.hypot(vx, vy);
    var radius = Math.max(1.4, aspect), offset = Math.sqrt(radius * radius - len * len / 4);
    var center = [(p[0] + q[0]) / 2 - vy / len * offset, (p[1] + q[1]) / 2 + vx / len * offset];
    var low = Math.atan2(p[1] - center[1], p[0] - center[0]) + .035, high = Math.atan2(q[1] - center[1], q[0] - center[0]) - .035;
    var ry = .4 - center[1], rest = Math.atan2(ry, -Math.sqrt(radius * radius - ry * ry));
    if (geometry) { state.angle += rest - geometry.rest; state.target += rest - geometry.rest; } else state.angle = state.target = rest;
    geometry = { center: center, radius: radius, low: low, high: high, rest: rest };
    state.angle = clamp(state.angle, low, high); state.target = clamp(state.target, low, high);
    state.last = 0; requestFrame();
  }

  function stop() { cancelAnimationFrame(state.frame); state.frame = 0; state.last = 0; }
  function requestFrame() { if (!state.frame && visible && !document.hidden && ready && geometry) state.frame = requestAnimationFrame(draw); }
  function common(u) {
    var g = geometry, s = still();
    gl.uniform2f(u.resolution, canvas.width, canvas.height); gl.uniform2f(u.center, g.center[0], g.center[1]);
    gl.uniform1f(u.radius, g.radius); gl.uniform1f(u.angle, state.angle);
    gl.uniform1f(u.clock, s ? 0 : state.clock); gl.uniform1f(u.charge, 0); gl.uniform1f(u.pulse, -1);
    gl.uniform1f(u.still, s ? 1 : 0); gl.uniform1f(u.pulseAngle, 0);
    gl.uniform2f(u.drift, s ? 0 : state.drift[0], s ? 0 : state.drift[1]);
  }
  function draw(now) {
    state.frame = 0;
    if (!visible || document.hidden || !geometry) return;
    var moving = Math.abs(state.target - state.angle) > .0001 || Math.abs(state.targetReveal - state.reveal) > .001;
    // Idle: about 30 fps is plenty for the slow twinkle.
    if (!moving && state.last && now - state.last < 32 && !still()) { requestFrame(); return; }
    var dt = Math.min((now - (state.last || now - 16)) / 1000, .05);
    state.last = now; state.clock += dt;
    var mv = still() ? 1 : 1 - Math.exp(-dt / .24);
    var ex = still() ? 1 : 1 - Math.exp(-dt / (state.targetReveal > state.reveal ? .8 : .48));
    state.angle += (state.target - state.angle) * mv; state.reveal += (state.targetReveal - state.reveal) * ex;
    state.drift = state.drift.map(function (v, i) { return v + (state.targetDrift[i] - v) * mv * .5; });
    gl.viewport(0, 0, canvas.width, canvas.height); gl.disable(gl.BLEND); gl.disableVertexAttribArray(starTail);
    quad(program, position); common(U);
    gl.uniform1f(U.reveal, state.reveal); gl.uniform1f(U.viewAngle, geometry.rest);
    gl.uniform1f(U.galaxyBrightness, GALAXY); gl.uniform1f(U.surfaceBrightness, SURFACE);
    gl.uniform4f(U.auroraColor, 0, 0, 0, 0); gl.uniform4f(U.backgroundColor, 0, 0, 0, 0);
    gl.uniform1f(U.illumination, ILLUMINATION); gl.uniform1f(U.auroraPreview, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform1i(U.earth, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, cosmos); gl.uniform1i(U.cosmos, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(stars); common(SU); gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
    gl.enableVertexAttribArray(starPosition); gl.enableVertexAttribArray(starTail);
    gl.vertexAttribPointer(starPosition, 4, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(starTail, 1, gl.FLOAT, false, 20, 16);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.drawArrays(gl.POINTS, 0, STAR_COUNT * 7); gl.disable(gl.BLEND);
    if (!still()) requestFrame();
  }

  // The pointer anywhere on the page gently guides the sunlight along the horizon.
  window.addEventListener("pointermove", function (e) {
    if (!geometry || e.pointerType === "touch") return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    var x = e.clientX / h - geometry.center[0], y = e.clientY / h - geometry.center[1];
    var a = Math.atan2(y, x); if (a > 0) a -= Math.PI * 2;
    state.target = clamp(a, geometry.low, geometry.high);
    var dist = Math.hypot(x, y) - geometry.radius;
    state.targetReveal = Math.exp(-Math.pow((a - geometry.rest) / .15, 2)) * Math.exp(-Math.pow((dist + .015) / .12, 2)) * .6;
    state.targetDrift = [e.clientX / w - .5, e.clientY / h - .5];
    requestFrame();
  }, { passive: true });
  document.addEventListener("pointerleave", function () { if (geometry) { state.target = geometry.rest; state.targetReveal = 0; state.targetDrift = [0, 0]; requestFrame(); } });

  function syncTheme() {
    visible = root.classList.contains("dark");
    if (visible) { resize(); } else stop();
  }
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else { state.last = 0; requestFrame(); } });
  if (media.addEventListener) media.addEventListener("change", function () { state.last = 0; requestFrame(); });
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); ready = false; stop(); });

  try { setup(); syncTheme(); } catch (err) { canvas.remove(); root.classList.remove("has-earth"); }
})();
