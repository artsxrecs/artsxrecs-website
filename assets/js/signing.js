// ArtsxRecs homepage — the signature is written in ONE unbroken pen line, like an artist would:
// from the top of the long diagonal, down to the A, up and over the A to the far-left tip, then along
// the crossbar through the X, down into the V, up the R, round its loop and out along the long tail.
// No pen lifts, no pauses, no jumps: one even movement with a soft start and a soft finish, and a soft
// wet-ink tip. Shapes are the designer's vector strokes; each part of the line reveals only its own
// shapes, so crossings never show ink early. Data: signing-data.js (tools/build-from-svg.py + write-signing.py).
// Without JS, or with reduced motion, the finished logo simply shows.
(() => {
  const root = document.querySelector('.signing');
  const data = window.SIGNING;
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.documentElement.dataset.hero === 'bare') return; // alternative homepage without the signature
  // Version 2 (?intro=fade): the signature fades in slowly (CSS). ARTSXRECS is split in two halves that
  // start spread out to the screen edges and glide together in ONE unbroken movement at an even tempo:
  // a soft pick-up over the first quarter, then one steady speed, then a soft arrival over the last 30%.
  // The speed never jumps or dips: no pause, no whoosh, no snap.
  if (new URLSearchParams(location.search).get('intro') === 'fade') {
    root.dataset.intro = 'fade';
    const word = root.querySelector('.sig-word');
    const letters = [...root.querySelectorAll('.wm')];
    if (!word || !letters.length || !word.animate) return;
    const box = word.getBoundingClientRect();
    const unit = word.viewBox.baseVal.width / box.width; // SVG units per screen pixel
    const first = letters[0].getBoundingClientRect();
    const last = letters[letters.length - 1].getBoundingClientRect();
    const margin = Math.max(12, innerWidth * 0.025);
    const reachL = Math.max(first.left - margin, box.width * 0.2);
    const reachR = Math.max(innerWidth - margin - last.right, box.width * 0.2);
    const n = Math.max(...letters.map(l => Math.abs(+l.style.getPropertyValue('--o'))));
    const timing = { duration: 4600, delay: 400, fill: 'both' };
    const a = 0.25, b = 0.3, v = 1 / (1 - (a + b) / 2); // pick-up, arrival, steady speed (share of the way per unit of time)
    letters.forEach(l => {
      const o = +l.style.getPropertyValue('--o');
      const u = Math.abs(o) / n;                    // 0 for the X, 1 for the outer A and S
      const dir = Math.sign(o);
      const far = dir * (o < 0 ? reachL : reachR) * u; // px; evenly spread out to the edge
      const x = px => `translateX(${(px * unit).toFixed(2)}px)`;
      l.animate({ opacity: [0, 1], easing: 'ease' }, { ...timing, duration: 700 });
      l.animate([
        { offset: 0, transform: x(far), easing: 'cubic-bezier(0.333, 0, 0.667, 0.333)' }, // speeds up evenly
        { offset: a, transform: x(far * (1 - v * a / 2)), easing: 'linear' },             // steady glide
        { offset: 1 - b, transform: x(far * v * b / 2), easing: 'cubic-bezier(0.333, 0.667, 0.667, 1)' }, // slows evenly
        { offset: 1, transform: x(0) },
      ], timing);
    });
    return;
  }
  if (!data || typeof Path2D === 'undefined') return;

  const START = 200;     // ms before the pen touches the paper
  const DURATION = 1900; // ms for the whole line (client: twice as fast as the first 3.8 s)
  // The pen tip is solid. At this speed a soft, fading tip read as gaps in the line (the R's curl and
  // the start of its tail), so it's off; SOFT_TIP > 0 brings it back (TIP_ALPHA = how faint it gets).
  const SOFT_TIP = 0;    // length of the soft tip, in brush widths
  const TIP_ALPHA = 0.62;
  // Mostly even speed; only the very start and the very end are softened.
  const ease = (t) => 0.6 * t + 0.4 * (-(Math.cos(Math.PI * t) - 1) / 2);

  const canvas = root.querySelector('.sig-canvas');
  const ctx = canvas.getContext('2d');
  const temp = document.createElement('canvas');
  const tctx = temp.getContext('2d');
  const done = document.createElement('canvas');
  const dctx = done.getContext('2d');

  const [vx, vy, vw] = data.vb;
  const shapes = data.shapes.map((d) => new Path2D(d));

  // ---- the one continuous route, assembled from the traced pieces (each leg starts where the last ended)
  const raw = Object.fromEntries(data.pieces.map((p) => [p.name, p]));
  const rev = (a) => a.slice().reverse();
  const A = raw['A legs'], bar = raw['A crossbar'], fall = raw['X falling'], rise = raw['X rising'], stem = raw['R stem'], loop = raw['R loop + tail'];
  const legs = [
    { from: rise, pts: rev(rise.pts) },                                   // down the long diagonal to the A's foot
    { from: A, pts: rev(A.pts.slice(3)) },                                // up the A, over the top, down to where the crossbar starts
    { from: bar, pts: bar.pts },                                          // straight on along the crossbar
    { from: fall, pts: fall.pts },                                        // into the X and down to the V
    { from: stem, pts: stem.pts.slice(0, 7) },                            // up the R's stem to where its head starts
    // The loop and the tail start at the same spot, so they reveal separately (otherwise the tail's start
    // pops up while the loop begins), and the loop gets a finer tip so its returning line doesn't show early.
    // Round the R's loop: it leaves from inside the stem, so its first bit joins the stem with no gap. A
    // fine tip there (its returning line ends right next to it), widening on the way up so the thick curl
    // at the top is drawn fully.
    { from: loop, pts: [[251.8, 67.4], ...loop.pts.slice(0, 17)], shapes: [3], width: 13, ramp: [[0, 5.2], [8, 7], [24, 7], [42, 13]] },
    // Out along the long tail. It starts as fine as the line coming into it and swells to its full
    // weight over its first stretch (grow: [start width, units]), so the turn into it is one movement
    // instead of a heavy blob appearing at once.
    { from: loop, pts: loop.pts.slice(16), shapes: [4], grow: [5, 32] },
  ];
  // Dead ends (the far-left tip, the top of the R's stem): instead of the pen going out and coming back
  // over ink that's already there (a visible hiccup), they grow on their own while the pen flows on.
  // They grow 3x faster and solid (no wet tip), like ink spreading, so they never look like a second pen.
  const side = [
    { from: A, pts: rev(A.pts.slice(0, 4)), shapes: [1, 2], alongside: 2, rate: 3 }, // the far-left tip, alongside the crossbar
    { from: stem, pts: stem.pts.slice(6), alongside: 5, rate: 3 },          // the stem's top, alongside the R's loop
  ];

  // Catmull-Rom through the traced points, sampled every ~1.2 units: the tip moves on curves, not corners.
  function smooth(pts) {
    const p = [pts[0], ...pts, pts[pts.length - 1]];
    const out = [pts[0]];
    for (let i = 1; i < p.length - 2; i++) {
      const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
      const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 1.2));
      for (let s = 1; s <= n; s++) {
        const t = s / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((c) =>
          0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)
        ));
      }
    }
    return out;
  }

  // Trim a leg's route to where its own ink actually is: the pen should never spend time over empty
  // paper (that reads as the drawing getting stuck). Checked on a small offscreen render of the shapes.
  const vh = data.vb[3];
  const AS = 3; // analysis px per unit
  const probe = document.createElement('canvas');
  probe.width = Math.ceil(vw * AS);
  probe.height = Math.ceil(vh * AS);
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  function trimToInk(pts, shapeIdx, width) {
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, probe.width, probe.height);
    pctx.setTransform(AS, 0, 0, AS, -vx * AS, -vy * AS);
    for (const s of shapeIdx) pctx.fill(shapes[s]);
    const img = pctx.getImageData(0, 0, probe.width, probe.height).data;
    const r = Math.max(1, Math.round(width * 0.25 * AS));
    const hit = ([x, y]) => {
      const cx = Math.round((x - vx) * AS), cy = Math.round((y - vy) * AS);
      for (let dy = -r; dy <= r; dy += r) for (let dx = -r; dx <= r; dx += r) {
        const px = cx + dx, py = cy + dy;
        if (px >= 0 && py >= 0 && px < probe.width && py < probe.height && img[(py * probe.width + px) * 4 + 3] > 40) return true;
      }
      return false;
    };
    let a = 0, b = pts.length - 1;
    while (a < b && !hit(pts[a])) a++;
    while (b > a && !hit(pts[b])) b--;
    return pts.slice(a, b + 1);
  }

  // `start` = distance along the line at which a leg begins. Side legs grow in step with their main leg.
  function makeLeg(l, start) {
    const pts = trimToInk(smooth(l.pts), l.shapes || l.from.shapes, l.width || l.from.width);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const leg = { shapes: l.shapes || l.from.shapes, width: l.width || l.from.width, pts, cum, len: cum[cum.length - 1], start, rate: l.rate || 0, grow: l.grow, baked: false };
    if (l.ramp) {
      // [distance along the leg, width] pairs, straight lines between them
      leg.widthAt = (s) => {
        const j = l.ramp.findIndex(([a]) => s < a);
        if (j < 0) return l.ramp[l.ramp.length - 1][1];
        if (j === 0) return l.ramp[0][1];
        const [a, w0] = l.ramp[j - 1], [b, w1] = l.ramp[j];
        return w0 + ((w1 - w0) * (s - a)) / (b - a);
      };
    }
    return leg;
  }
  let total = 0;
  const main = legs.map((l) => {
    const leg = makeLeg(l, total);
    total += leg.len;
    return leg;
  });
  const pieces = main.concat(side.map((l) => makeLeg(l, main[l.alongside].start)));

  // Even ink flow. Where the pen runs over ink that is already showing (round the tight curl at the top
  // of the R, the bottom of the V, crossings), nothing new appears for a moment and the drawing seems to
  // catch. So the pen spends less time there: time follows the distance, except where a step of the pen
  // adds less than 60% of the new ink a step of that leg usually adds. Measured once on a small render.
  const FLOW = 1.5; // analysis px per unit
  const flow = (() => {
    const fw = Math.ceil(vw * FLOW), fh = Math.ceil(vh * FLOW);
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const g = c.getContext('2d', { willReadFrequently: true });
    const shown = new Uint8Array(fw * fh);
    const dist = [0], cost = [0];
    for (const p of main) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, fw, fh);
      g.setTransform(FLOW, 0, 0, FLOW, -vx * FLOW, -vy * FLOW);
      for (const s of p.shapes) g.fill(shapes[s]);
      const ink = g.getImageData(0, 0, fw, fh).data;
      const gains = [];
      for (let s = 1; s < p.len + 1; s++) {
        // new ink under the round brush with the pen at `s`
        const q = pointAt(p, Math.min(s, p.len));
        const r = ((p.widthAt ? p.widthAt(s) : p.width) / 2) * FLOW;
        const cx = (q.x - vx) * FLOW, cy = (q.y - vy) * FLOW;
        let n = 0;
        for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(fh - 1, Math.ceil(cy + r)); y++) {
          for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(fw - 1, Math.ceil(cx + r)); x++) {
            const i = y * fw + x;
            if (!shown[i] && ink[i * 4 + 3] > 127 && (x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
              shown[i] = 1;
              n++;
            }
          }
        }
        gains.push(n);
      }
      const usual = gains.slice().sort((a, b) => a - b)[gains.length >> 1] || 1;
      gains.forEach((n, j) => {
        const step = Math.min(1, p.len - j);
        dist.push(p.start + j + step);
        cost.push(cost[cost.length - 1] + step * Math.min(1, Math.max(0.15, n / (0.6 * usual))));
      });
    }
    return { dist, cost };
  })();
  const totalCost = flow.cost[flow.cost.length - 1];
  function distanceAt(c) {
    const { dist, cost } = flow;
    let lo = 1, hi = cost.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cost[mid] < c) lo = mid + 1;
      else hi = mid;
    }
    const f = (c - cost[lo - 1]) / (cost[lo] - cost[lo - 1] || 1);
    return Math.min(total, dist[lo - 1] + (dist[lo] - dist[lo - 1]) * Math.max(0, Math.min(1, f)));
  }

  // Review aid: index.html#t=1500 freezes the drawing at 1.5 s (the wordmark fade is CSS and keeps running).
  const freeze = /[#&]t=(\d+)/.exec(location.hash);

  let W = 0, H = 0, k = 1, baked = 0;

  function pointAt(p, len) {
    let lo = 0, hi = p.cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (p.cum[mid] < len) lo = mid + 1;
      else hi = mid;
    }
    const i = Math.max(1, lo);
    const f = (len - p.cum[i - 1]) / (p.cum[i] - p.cum[i - 1] || 1);
    return { i, x: p.pts[i - 1][0] + (p.pts[i][0] - p.pts[i - 1][0]) * f, y: p.pts[i - 1][1] + (p.pts[i][1] - p.pts[i - 1][1]) * f };
  }

  function brush(p, from, to, alpha) {
    if (to <= from) return;
    const a = pointAt(p, from);
    const b = pointAt(p, to);
    tctx.globalAlpha = alpha;
    if (p.widthAt) {
      // Width changes along the route: one filled outline (offset both sides by half the local width)
      // plus round ends — a single fill, so a soft (semi-transparent) tip stays even.
      const pts = [[a.x, a.y, from]];
      for (let i = a.i; i < b.i; i++) pts.push([p.pts[i][0], p.pts[i][1], p.cum[i]]);
      pts.push([b.x, b.y, to]);
      const left = [], right = [];
      for (let i = 0; i < pts.length; i++) {
        const q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(pts.length - 1, i + 1)];
        let nx = -(q1[1] - q0[1]), ny = q1[0] - q0[0];
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl; ny /= nl;
        const h = p.widthAt(pts[i][2]) / 2;
        left.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
        right.push([pts[i][0] - nx * h, pts[i][1] - ny * h]);
      }
      tctx.fillStyle = tctx.strokeStyle;
      tctx.beginPath();
      tctx.moveTo(left[0][0], left[0][1]);
      for (const q of left.slice(1)) tctx.lineTo(q[0], q[1]);
      for (const q of right.reverse()) tctx.lineTo(q[0], q[1]);
      tctx.closePath();
      tctx.fill();
      if (tctx.lineCap === 'round') {
        for (const q of [pts[0], pts[pts.length - 1]]) {
          tctx.beginPath();
          tctx.arc(q[0], q[1], p.widthAt(q[2]) / 2, 0, Math.PI * 2);
          tctx.fill();
        }
      }
      return;
    }
    tctx.beginPath();
    tctx.moveTo(a.x, a.y);
    for (let i = a.i; i < b.i; i++) tctx.lineTo(p.pts[i][0], p.pts[i][1]);
    tctx.lineTo(b.x, b.y);
    tctx.stroke();
  }

  // Brush a leg up to the pen position `d` (distance along the whole line). The last `F` units behind the
  // pen fade in softly (wet ink); the fade is measured along the whole line, so it flows across legs.
  // Keep only the leg's own ink and paint it onto `target`.
  function reveal(target, p, d, F) {
    const end = Math.min(p.len, d - p.start);
    if (end <= 0) return;
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.globalCompositeOperation = 'source-over';
    tctx.globalAlpha = 1;
    tctx.clearRect(0, 0, W, H);
    tctx.setTransform(k, 0, 0, k, -vx * k, -vy * k);
    tctx.lineJoin = 'round';
    if (p.grow) {
      // the whole drawn part swells together as the pen moves on, like ink spreading (smoothstep)
      const f = Math.min(1, end / p.grow[1]);
      tctx.lineWidth = p.grow[0] + (p.width - p.grow[0]) * f * f * (3 - 2 * f);
    } else tctx.lineWidth = p.width;
    tctx.strokeStyle = '#fff';
    const solid = Math.min(end, d - F - p.start);
    tctx.lineCap = 'round';
    if (solid > 0) brush(p, 0, solid, 1);
    if (end > Math.max(0, solid)) {
      // The wet tip: one stroke with a smooth gradient (no steps, so no stripes at sharp turns).
      const from = Math.max(0, solid);
      const alphaAt = (local) => Math.min(1, Math.max(TIP_ALPHA, 1 - ((1 - TIP_ALPHA) * (p.start + local - (d - F))) / F));
      const a = pointAt(p, from);
      const b = pointAt(p, end);
      const g = tctx.createLinearGradient(a.x, a.y, b.x + 0.001, b.y + 0.001);
      g.addColorStop(0, `rgba(255,255,255,${alphaAt(from)})`);
      g.addColorStop(1, `rgba(255,255,255,${alphaAt(end)})`);
      tctx.strokeStyle = g;
      brush(p, from, end, 1);
      tctx.strokeStyle = '#fff';
    }
    tctx.globalAlpha = 1;
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.globalCompositeOperation = 'source-in';
    tctx.drawImage(p.mask, 0, 0); // the leg's own ink (union of its shapes)
    target.drawImage(temp, 0, 0);
  }

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width * dpr));
    H = Math.max(1, Math.round(r.height * dpr));
    for (const c of [canvas, temp, done]) {
      c.width = W;
      c.height = H;
    }
    k = W / vw;
    for (const p of pieces) {
      p.mask = p.mask || document.createElement('canvas');
      p.mask.width = W;
      p.mask.height = H;
      const m = p.mask.getContext('2d');
      m.setTransform(k, 0, 0, k, -vx * k, -vy * k);
      m.fillStyle = '#000';
      for (const s of p.shapes) m.fill(shapes[s]);
    }
    dctx.clearRect(0, 0, W, H);
    for (const p of pieces) if (p.baked) reveal(dctx, p, Infinity, 0);
    filled.clear();
    fillFinishedShapes();
  }

  // Once every leg that uses a shape is finished, that shape is filled in completely, so no tiny
  // uncovered bit of ink can wait until the very end to appear.
  const filled = new Set();
  function fillFinishedShapes() {
    for (let s = 0; s < shapes.length; s++) {
      if (filled.has(s)) continue;
      const users = pieces.filter((p) => p.shapes.includes(s));
      if (users.length && users.every((p) => p.baked)) {
        dctx.setTransform(k, 0, 0, k, -vx * k, -vy * k);
        dctx.fillStyle = '#000';
        dctx.fill(shapes[s]);
        dctx.setTransform(1, 0, 0, 1, 0, 0);
        filled.add(s);
      }
    }
  }

  // Draw the state with the pen at distance `d`. A leg is baked (drawn once, solid) when even its
  // soft tip has fully dried; legs still in progress are drawn fresh each frame.
  let lastD = 0;
  function draw(d) {
    lastD = d;
    const F = d >= total ? 0 : 12 * SOFT_TIP; // at the very end the wet tip dries: everything solid
    // Side legs run ahead of the pen (rate) and have no wet tip.
    const at = (p) => (p.rate ? p.start + (d - p.start) * p.rate : d);
    const tip = (p) => (p.rate ? 0 : F);
    for (const p of pieces) {
      if (!p.baked && at(p) - tip(p) >= p.start + p.len) {
        reveal(dctx, p, Infinity, 0);
        p.baked = true;
      }
    }
    fillFinishedShapes();
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(done, 0, 0);
    for (const p of pieces) if (!p.baked && p.start < d) reveal(ctx, p, at(p), tip(p));
  }

  let t0 = 0;
  function frame(now) {
    if (freeze) now = t0 + Number(freeze[1]);
    const t = Math.min(1, Math.max(0, (now - t0 - START) / DURATION));
    draw(distanceAt(ease(t) * totalCost)); // how far along the one line the pen is
    if (t >= 1) root.classList.add('is-signed');
    if (!freeze && t < 1) requestAnimationFrame(frame);
  }

  // Review aid for timing checks: draw the state at `ms` after load, from scratch.
  root.signingAt = (ms) => {
    for (const p of pieces) p.baked = false;
    filled.clear();
    dctx.clearRect(0, 0, W, H);
    const t = Math.min(1, Math.max(0, (ms - START) / DURATION));
    const d = distanceAt(ease(t) * totalCost);
    draw(d);
    return {
      d: Math.round(d * 10) / 10,
      leg: main.findIndex((p) => d < p.start + p.len),
      legs: pieces.map((p) => [Math.round(p.start), Math.round(p.len), p.shapes.join('+'), p.baked ? 'baked' : '']),
    };
  };

  root.classList.add('is-signing');
  size();
  window.addEventListener('resize', () => {
    size();
    draw(lastD); // resizing clears the canvas: put the current state straight back
  });
  t0 = performance.now();
  if (freeze) frame(t0);
  else requestAnimationFrame(frame);
})();
