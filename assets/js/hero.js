// ArtsxRecs homepage — the logo as the hero, in three draft concepts:
//   a  Frosted       the signature sits behind frosted glass; it sharpens where you point
//   b  Fluted glass  the signature seen through reeded glass; the reeds shift with the cursor
//   c  Relief        the signature pressed into stone; the cursor is the light
(() => {
  // PARKED (2026-10-21): the client asked for a still logo, so index.html no longer loads this file.
  // To bring an effect back: re-add the canvas + switcher markup and <script src="assets/js/hero.js">.
  const LOGO_SRC = 'assets/img/logo-mark.png';
  const PLACEHOLDER_TEXT = 'ArtsxRecs';

  const hero = document.querySelector('.hero');
  const canvas = hero.querySelector('canvas');
  const switcher = document.querySelector('.concepts');
  const hint = document.querySelector('[data-hint]');
  const touch = matchMedia('(hover: none)').matches;
  const HINTS = touch
    ? {
        a: 'Frosted — touch the signature to bring it into focus.',
        b: 'Fluted glass — slide your finger to bend the reeds.',
        c: 'Relief — the signature is pressed into stone; your finger is the light.',
      }
    : {
        a: 'Frosted — the signature comes into focus where you point.',
        b: 'Fluted glass — the reeds bend the signature as you move.',
        c: 'Relief — the signature is pressed into stone; your cursor is the light.',
      };
  const MODES = { a: 0, b: 1, c: 2 };

  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) {
    hero.classList.add('no-webgl');
    if (switcher) switcher.hidden = true;
    return;
  }

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.body);
  const rgb = (name) => {
    const h = css.getPropertyValue(name).trim().replace('#', '');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  };

  // ---------- shaders

  const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

  const FRAG = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform vec2 u_res;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_reveal;
  uniform float u_mode;
  uniform float u_logoW;
  uniform vec2 u_center;
  uniform float u_flute;
  uniform float u_dpr;
  uniform vec3 u_bg;
  uniform vec3 u_ink;
  uniform sampler2D u_logo;
  uniform sampler2D u_soft;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }

  // screen pixel -> logo texture uv (logo texture is 2:1)
  vec2 toUV(vec2 frag){
    float w = u_logoW * u_res.x;
    return (frag - u_center * u_res) / vec2(w, w * 0.5) + 0.5;
  }

  // soft disc blur on top of the mip chain
  float blurA(vec2 uv, float lod){
    float r = exp2(lod) / 2048.0;
    float s = 0.0;
    for (int i = 0; i < 8; i++){
      float fi = float(i);
      float ang = fi * 2.39996 + 0.5;
      float rad = sqrt((fi + 0.5) / 8.0) * r;
      s += texture2D(u_logo, uv + vec2(cos(ang), sin(ang) * 2.0) * rad, lod).a;
    }
    return s / 8.0;
  }

  vec3 frosted(vec2 frag){
    vec2 drift = vec2(sin(u_time * 0.06), cos(u_time * 0.045)) * u_res.x * 0.012;
    vec2 f = frag - drift;
    float focus = max(1.0 - smoothstep(0.02, 0.2, length((frag - u_mouse) / u_res.x)), u_reveal);
    vec2 haze = vec2(noise(frag / u_dpr * 0.004 + u_time * 0.05), noise(frag / u_dpr * 0.004 - u_time * 0.04)) - 0.5;
    f += haze * u_res.x * 0.016 * (1.0 - focus);
    float a = blurA(toUV(f), mix(4.6, 0.4, focus));
    return mix(u_bg, u_ink, min(1.0, a * mix(0.9, 0.95, focus) * 1.15));
  }

  vec3 fluted(vec2 frag){
    float t = fract(frag.x / u_flute) - 0.5;          // position across one reed, -0.5..0.5
    float mx = u_mouse.x / u_res.x - 0.5;
    float my = u_mouse.y / u_res.y - 0.5;
    vec2 f = frag;
    f.x += sin(t * 3.14159) * u_flute * (0.42 + mx * 0.35) + mx * u_res.x * 0.02;
    f.y += my * u_res.y * 0.01;
    float a = blurA(toUV(f), 0.5 + abs(t) * 1.4);
    vec3 col = mix(u_bg, u_ink, a * 0.88);
    float highlight = pow(max(0.0, 1.0 - abs(t + 0.22) * 5.0), 2.0);
    float seam = smoothstep(0.38, 0.5, abs(t));
    col += highlight * 0.05;
    col *= 1.0 - seam * 0.07;
    return col;
  }

  vec3 relief(vec2 frag){
    vec2 uv = toUV(frag);
    vec2 tx = vec2(1.0 / 1024.0, 1.0 / 512.0) * 1.5;
    float h  = texture2D(u_soft, uv).a;
    float hx = texture2D(u_soft, uv + vec2(tx.x, 0.0)).a - texture2D(u_soft, uv - vec2(tx.x, 0.0)).a;
    float hy = texture2D(u_soft, uv + vec2(0.0, tx.y)).a - texture2D(u_soft, uv - vec2(0.0, tx.y)).a;
    vec3 n = normalize(vec3(hx * 5.0, hy * 5.0, 1.0));           // pressed in
    vec3 l = normalize(vec3(u_mouse, u_res.x * 0.28) - vec3(frag, 0.0));
    float diff = max(dot(n, l), 0.0);
    float spec = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 60.0);
    vec2 sp = frag / u_dpr;
    float stone = fbm(sp * 0.01) * 0.6 + fbm(sp * 0.06) * 0.4;
    float pool = 1.0 - smoothstep(0.0, 1.2, length((frag - u_mouse) / u_res.x));
    vec3 col = u_bg * (0.9 + 0.16 * stone) * (0.62 + 0.38 * diff + 0.18 * pool);
    col += spec * 0.18 * vec3(1.0, 0.97, 0.92);
    return mix(col, col * 0.8, h * 0.35);
  }

  void main(){
    vec2 frag = gl_FragCoord.xy;
    vec3 col = u_mode < 0.5 ? frosted(frag) : (u_mode < 1.5 ? fluted(frag) : relief(frag));
    col += (hash(frag + fract(u_time * 7.0) * vec2(37.0, 91.0)) - 0.5) * 0.035;   // film grain
    vec2 q = frag / u_res - 0.5;
    col *= 1.0 - 0.12 * dot(q, q);
    gl_FragColor = vec4(col, 1.0);
  }`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    console.error(err);
    hero.classList.add('no-webgl');
    if (switcher) switcher.hidden = true;
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['u_res', 'u_time', 'u_mouse', 'u_reveal', 'u_mode', 'u_logoW', 'u_center', 'u_flute', 'u_dpr', 'u_bg', 'u_ink', 'u_logo', 'u_soft'].forEach(
    (n) => (U[n] = gl.getUniformLocation(prog, n))
  );
  gl.uniform3fv(U.u_bg, rgb('--hero-bg'));
  gl.uniform3fv(U.u_ink, rgb('--charcoal'));
  gl.uniform1i(U.u_logo, 0);
  gl.uniform1i(U.u_soft, 1);

  // ---------- logo textures

  async function drawLogo() {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const g = c.getContext('2d');
    if (LOGO_SRC) {
      const img = new Image();
      img.src = LOGO_SRC;
      await img.decode();
      const s = Math.min((c.width * 0.82) / img.naturalWidth, (c.height * 0.62) / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      g.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#fff';
      g.fillRect(0, 0, c.width, c.height);
    } else {
      const family = '"Mrs Saint Delafield"';
      await document.fonts.load(`400 100px ${family}`);
      g.font = `400 600px ${family}`;
      let m = g.measureText(PLACEHOLDER_TEXT);
      const s = Math.min(
        (c.width * 0.82) / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight),
        (c.height * 0.62) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)
      );
      g.font = `400 ${600 * s}px ${family}`;
      m = g.measureText(PLACEHOLDER_TEXT);
      const bw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      const bh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
      g.fillStyle = '#fff';
      g.textAlign = 'left';
      g.textBaseline = 'alphabetic';
      g.fillText(PLACEHOLDER_TEXT, (c.width - bw) / 2 + m.actualBoundingBoxLeft, (c.height - bh) / 2 + m.actualBoundingBoxAscent);
    }
    return c;
  }

  // Pre-blurred copy used as a height map for the relief.
  function softCopy(src) {
    const w = 1024, h = 512, r = 5;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(src, 0, 0, w, h);
    const img = g.getImageData(0, 0, w, h);
    let a = new Float32Array(w * h);
    let b = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) a[i] = img.data[i * 4 + 3];
    const k = 1 / (2 * r + 1);
    const pass = (s, d, horizontal) => {
      const lines = horizontal ? h : w, len = horizontal ? w : h;
      const step = horizontal ? 1 : w, lineStep = horizontal ? w : 1;
      for (let L = 0; L < lines; L++) {
        const o = L * lineStep;
        let acc = 0;
        for (let x = -r; x <= r; x++) acc += s[o + Math.min(len - 1, Math.max(0, x)) * step];
        for (let x = 0; x < len; x++) {
          d[o + x * step] = acc * k;
          acc += s[o + Math.min(len - 1, x + r + 1) * step] - s[o + Math.max(0, x - r) * step];
        }
      }
    };
    for (let p = 0; p < 3; p++) {
      pass(a, b, true);
      pass(b, a, false);
    }
    for (let i = 0; i < w * h; i++) {
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255;
      img.data[i * 4 + 3] = a[i];
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function texture(unit, source) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  // ---------- size, pointer, loop

  let W = 0, H = 0, dpr = 1;
  let logoW = 0.72, centerY = 0.58;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.round(canvas.clientWidth * dpr);
    H = Math.round(canvas.clientHeight * dpr);
    canvas.width = W;
    canvas.height = H;
    gl.viewport(0, 0, W, H);
    const aspect = W / H;
    // The whole signature stays readable: ~70% of the width on desktop, nearly full width on phones.
    logoW = aspect >= 1 ? 0.72 : 0.94;
    centerY = aspect >= 1 ? 0.58 : 0.62;
    gl.uniform2f(U.u_res, W, H);
    gl.uniform1f(U.u_dpr, dpr);
    gl.uniform1f(U.u_logoW, logoW);
    gl.uniform2f(U.u_center, 0.5, centerY);
    gl.uniform1f(U.u_flute, (aspect >= 1 ? 30 : 20) * dpr);
    if (!mouse) mouse = [W * 0.5, H * centerY];
    if (!running) draw(performance.now());
  }

  // Half-size of the signature on screen (the drawing fills ~82% x 62% of the 2:1 texture).
  const sigHalfW = () => W * logoW * 0.41;
  const sigHalfH = () => W * logoW * 0.155;

  let mouse = null;
  let target = null;
  let lastMove = -1e9;
  function point(e) {
    const r = canvas.getBoundingClientRect();
    target = [(e.clientX - r.left) * dpr, (r.height - (e.clientY - r.top)) * dpr];
    lastMove = performance.now();
    if (!running) {
      mouse = target.slice();
      draw(lastMove);
    }
  }
  // Mouse: anywhere on the page. Touch: tap or drag on the hero (vertical swipes still scroll the page).
  window.addEventListener('pointermove', (e) => e.pointerType === 'mouse' && point(e), { passive: true });
  hero.addEventListener('pointerdown', (e) => e.pointerType !== 'mouse' && point(e), { passive: true });
  hero.addEventListener('pointermove', (e) => e.pointerType !== 'mouse' && point(e), { passive: true });

  // Nobody pointing: the focus / light drifts along the signature on its own.
  const autopilot = (t) => [
    W * 0.5 + sigHalfW() * 0.85 * Math.sin(t * 0.3),
    H * centerY + sigHalfH() * 0.6 * Math.sin(t * 0.47 + 1.3),
  ];

  // Opening moment: one sweep across the signature, so every visitor sees the effect
  // in the first seconds, with or without a mouse. Replays when a concept is switched.
  const INTRO = 2.8;
  let introStart = -1e9;
  const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

  let mode = 0;
  const start = performance.now();
  let last = start;
  function draw(now) {
    const t = (now - start) / 1000;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const k = (now - introStart) / 1000 / INTRO;
    let reveal = 0;
    if (k >= 0 && k < 1 && !reduceMotion) {
      const p = easeInOut(k);
      mouse = [W * 0.5 + sigHalfW() * 1.05 * (2 * p - 1), H * centerY + sigHalfH() * 0.35];
      reveal = Math.sin(Math.PI * Math.min(1, k * 1.15)); // frosted: comes into focus, then frosts over
    } else {
      const goal = now - lastMove < 3500 && target ? target : autopilot(t);
      const ease = 1 - Math.pow(0.9, dt * 60);
      mouse[0] += (goal[0] - mouse[0]) * ease;
      mouse[1] += (goal[1] - mouse[1]) * ease;
    }
    gl.uniform1f(U.u_time, reduceMotion ? 0 : t);
    gl.uniform2f(U.u_mouse, mouse[0], mouse[1]);
    gl.uniform1f(U.u_reveal, reveal);
    gl.uniform1f(U.u_mode, mode);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let running = false;
  let visible = true;
  function loop(now) {
    if (!running) return;
    draw(now);
    requestAnimationFrame(loop);
  }
  function setRunning() {
    const should = visible && !document.hidden && !reduceMotion;
    if (should && !running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(loop);
    } else if (!should) {
      running = false;
    }
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    setRunning();
  }).observe(hero);
  document.addEventListener('visibilitychange', setRunning);

  // ---------- concept switcher (draft only), state in ?v=

  function setConcept(key, fade) {
    if (!(key in MODES)) key = 'a';
    const apply = () => {
      mode = MODES[key];
      introStart = performance.now();
      if (!running) draw(performance.now());
      canvas.style.opacity = 1;
    };
    if (fade) {
      canvas.style.opacity = 0;
      setTimeout(apply, 260);
    } else apply();
    switcher?.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.concept === key)));
    if (hint) hint.textContent = HINTS[key];
  }
  switcher?.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.set('v', b.dataset.concept);
      history.replaceState(null, '', url);
      setConcept(b.dataset.concept, true);
    })
  );

  // ---------- go

  (async () => {
    const logo = await drawLogo();
    texture(0, logo);
    texture(1, softCopy(logo));
    resize();
    window.addEventListener('resize', resize);
    setConcept(new URLSearchParams(location.search).get('v') || 'a', false);
    canvas.classList.add('ready');
    setRunning();
  })();
})();
