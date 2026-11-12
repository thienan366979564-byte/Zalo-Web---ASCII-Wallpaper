// ==UserScript==
// @name         Zalo Web - ASCII Wallpaper
// @namespace    https://chat.zalo.me/
// @version      1.3
// @description  Hình nền ASCII động cho chat.zalo.me: 16 theme: Claude Code, Cloud Drift, Honu Lagoon, Koi Pond, Jellyfish, Paper Boats, Fireflies, Moonlit, Ember, Blood Moon, Neon Rain, Aurora, Snowfall, Deep Space, Sakura
// @match        https://chat.zalo.me/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /* ===================== CẤU HÌNH ===================== */
  const CELL_W = 10;          // chiều rộng 1 ô ký tự (px)
  const CELL_H = 12;          // chiều cao 1 ô ký tự (px)
  const GLYPHS = '%:;t';
  const FONT = '11px ui-monospace, Menlo, Consolas, monospace';
  const BTN_POS = { bottom: '12px', left: '74px' }; // vị trí nút 🎨 (đổi nếu bị đè)
  const HOTKEY = (e) => e.ctrlKey && e.altKey && e.key.toLowerCase() === 't';

  /* ===================== TIỆN ÍCH ===================== */
  const store = {
    get: (k, d) => { try { return GM_getValue(k, d); } catch (e) { return d; } },
    set: (k, v) => { try { GM_setValue(k, v); } catch (e) {} },
  };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const snapX = (x) => Math.floor(x / CELL_W) * CELL_W;
  const snapY = (y) => Math.floor(y / CELL_H) * CELL_H;

  /* ===================== LỚP NỀN ===================== */
  const tint = document.createElement('div');
  tint.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:2147483000;transition:opacity .4s;';
  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483001;';
  document.documentElement.append(tint, canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  let st = {}; // trạng thái của cảnh hiện tại

  /* Vẽ 1 ô vuông chứa 1 ký tự */
  function cell(px, py, ch, bg, fg) {
    ctx.fillStyle = bg;
    ctx.fillRect(px, py, CELL_W - 1, CELL_H - 1);
    if (ch) {
      ctx.fillStyle = fg;
      ctx.fillText(ch, px + CELL_W / 2, py + CELL_H / 2);
    }
  }

  /* Vẽ sprite từ mảng chuỗi. Mỗi chữ cái ánh xạ sang [màu nền, màu chữ] trong pal */
  function drawSprite(rows, x, y, pal, flip) {
    const ox = snapX(x), oy = snapY(y);
    for (let r = 0; r < rows.length; r++) {
      const row = flip ? [...rows[r]].reverse().join('') : rows[r];
      for (let c = 0; c < row.length; c++) {
        const p = pal[row[c]];
        if (!p) continue;
        cell(ox + c * CELL_W, oy + r * CELL_H, GLYPHS[(r * 7 + c * 13) % GLYPHS.length], p[0], p[1]);
      }
    }
  }

  /* Sóng nước bằng ký tự ~ trôi ngang */
  function drawWaves(t, rgb, alpha, gap) {
    ctx.fillStyle = `rgba(${rgb},${alpha})`;
    for (let y = gap / 2, b = 0; y < H; y += gap, b++) {
      const dir = b % 2 ? 1 : -1;
      const off = (((t * 12 * dir) % 40) + 40) % 40;
      for (let x = -40 + off; x < W + 40; x += 40) {
        const yy = y + Math.sin(t * 1.1 + x * 0.03 + b) * 5;
        ctx.fillText('~', x + ((b * 17) % 20), yy);
      }
    }
  }

  /* ===================== 1. CLAUDE CODE ===================== */
  const MASCOT_TOP = [
    '    ######    ',
    '    #e##e#    ',
    '##############',
    '##############',
    '    ######    ',
  ];
  const LEGS_A = ['    #    #    ', '    #    #    '];
  const LEGS_B = ['     #  #     ', '     #  #     '];
  const MASCOT_PAL = {
    '#': ['#d97757', '#8f3f26'],
    e: ['#2b1810', '#2b1810'],
  };
  const SPARK_COLORS = ['255,154,90', '255,211,122', '255,107,74', '247,224,192'];

  function initClaude() {
    st.mascot = { x: W * 0.7, dir: -1 };
    st.sparks = [];
    st.next = 0;
  }
  function spawnBurst() {
    const cx = rnd(W * 0.1, W * 0.9), cy = rnd(H * 0.1, H * 0.5);
    const c = SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0];
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(-0.1, 0.1);
      const s = rnd(50, 110);
      st.sparks.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(1.1, 1.7), c });
    }
  }
  function drawClaude(dt, t) {
    st.next -= dt;
    if (st.next <= 0) { spawnBurst(); st.next = rnd(0.8, 2.2); }
    for (let i = st.sparks.length - 1; i >= 0; i--) {
      const p = st.sparks[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 70 * dt; p.vx *= 0.99; p.life -= dt;
      if (p.life <= 0) { st.sparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${p.c},${Math.min(1, p.life)})`;
      ctx.fillText(p.life > 0.9 ? '*' : p.life > 0.45 ? '+' : '.', p.x, p.y);
    }
    const m = st.mascot, mw = 14 * CELL_W;
    m.x += m.dir * 28 * dt;
    if (m.x < 20) { m.x = 20; m.dir = 1; }
    if (m.x > W - mw - 20) { m.x = W - mw - 20; m.dir = -1; }
    const legs = Math.floor(t * 4) % 2 ? LEGS_A : LEGS_B;
    drawSprite(MASCOT_TOP.concat(legs), m.x, H - 7 * CELL_H - 40, MASCOT_PAL);
  }

  /* ===================== 2. CLOUD DRIFT ===================== */
  function buildCloud() {
    const w = 12 + Math.floor(Math.random() * 16);
    const h = 5 + Math.floor(Math.random() * 4);
    const n = 3 + Math.floor(Math.random() * 3);
    const blobs = [];
    for (let i = 0; i < n; i++) {
      blobs.push({
        cx: (0.2 + (0.6 * i) / (n - 1)) * w,
        cy: h * (0.55 + (Math.random() - 0.5) * 0.2),
        rx: w * (0.18 + Math.random() * 0.12),
        ry: h * (0.3 + Math.random() * 0.2),
      });
    }
    const cells = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (blobs.some((b) => ((x - b.cx) / b.rx) ** 2 + ((y - b.cy) / b.ry) ** 2 <= 1)) {
          cells.push({ x, y, c: GLYPHS[(Math.random() * GLYPHS.length) | 0] });
        }
      }
    }
    return { cells, w, h };
  }
  function initCloud() {
    const count = Math.max(4, Math.round((W * H) / 150000));
    st.clouds = [];
    for (let i = 0; i < count; i++) {
      st.clouds.push({
        shape: buildCloud(),
        x: Math.random() * (W + 300) - 150,
        y: Math.random() * (H - 120),
        v: 6 + Math.random() * 10,
      });
    }
  }
  function drawCloud(dt) {
    for (const cl of st.clouds) {
      cl.x += cl.v * dt;
      if (cl.x > W + 20) {
        cl.x = -cl.shape.w * CELL_W - Math.random() * 200;
        cl.y = Math.random() * (H - 120);
      }
      const ox = snapX(cl.x), oy = snapY(cl.y);
      for (const c of cl.shape.cells) {
        if (Math.random() < 0.0015) c.c = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        cell(ox + c.x * CELL_W, oy + c.y * CELL_H, c.c, 'rgba(255,255,255,0.88)', 'rgba(105,120,138,0.9)');
      }
    }
  }

  /* ===================== 3. HONU LAGOON ===================== */
  const TURTLE = [
    '    ff      ',
    '  ssssss    ',
    ' ssssssssshh',
    '  ssssss    ',
    '    ff      ',
  ];
  const TURTLE_PAL = {
    s: ['rgba(63,154,106,.95)', 'rgba(20,80,50,.9)'],
    f: ['rgba(111,207,151,.95)', 'rgba(30,110,70,.9)'],
    h: ['rgba(138,215,164,.95)', 'rgba(30,110,70,.9)'],
  };
  function initHonu() {
    st.turtles = [
      { x: rnd(-100, W * 0.5), y: H * 0.35, dir: 1, sp: 18, ph: 0 },
      { x: rnd(W * 0.5, W), y: H * 0.7, dir: -1, sp: 14, ph: 2 },
    ];
    st.fish = [];
    for (let i = 0; i < 14; i++) {
      st.fish.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(25, 50) * (Math.random() < 0.5 ? 1 : -1), ph: rnd(0, 6.28) });
    }
  }
  function drawHonu(dt, t) {
    drawWaves(t, '255,255,255', 0.35, 70);
    for (const f of st.fish) {
      f.x += f.v * dt;
      if (f.x > W + 30) f.x = -30;
      if (f.x < -30) f.x = W + 30;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(f.v > 0 ? '><>' : '<><', f.x, f.y + Math.sin(t * 2 + f.ph) * 4);
    }
    for (const tu of st.turtles) {
      tu.x += tu.dir * tu.sp * dt;
      if (tu.dir > 0 && tu.x > W + 20) tu.x = -13 * CELL_W;
      if (tu.dir < 0 && tu.x < -13 * CELL_W) tu.x = W + 20;
      drawSprite(TURTLE, tu.x, tu.y + Math.sin(t * 0.6 + tu.ph) * 18, TURTLE_PAL, tu.dir < 0);
    }
  }

  /* ===================== 4. KOI POND ===================== */
  const KOI_PAL = {
    o: ['#ff8a3d', '#a64a12'],
    w: ['#fdfaf2', '#a9a49a'],
    r: ['#e8402b', '#7d1a0f'],
  };
  const KOI_N = 18;    // số đốt thân
  const KOI_STEP = 6;  // khoảng cách giữa các đốt (px)
  function koiPattern(n) {
    let s = '', c = 'w';
    while (s.length < n) {
      s += c.repeat(2 + Math.floor(Math.random() * 4));
      const opts = ['o', 'w', 'r'].filter((x) => x !== c);
      c = opts[(Math.random() * opts.length) | 0];
    }
    return s.slice(0, n);
  }
  function initKoi() {
    st.pads = [];
    const n = Math.max(6, Math.round((W * H) / 90000));
    for (let i = 0; i < n; i++) {
      st.pads.push({ x: rnd(0, W), y: rnd(0, H), r: Math.floor(rnd(3, 6)), f: Math.random() < 0.4 });
    }
    st.koi = [];
    for (let i = 0; i < 3; i++) {
      const x = rnd(W * 0.2, W * 0.8), y = rnd(H * 0.2, H * 0.8), a = rnd(0, 6.28);
      const trail = [];
      for (let j = 0; j < KOI_N; j++) trail.push({ x: x - Math.cos(a) * j * KOI_STEP, y: y - Math.sin(a) * j * KOI_STEP });
      st.koi.push({ x, y, a, sp: rnd(28, 42), ph: rnd(0, 6), trail, pat: koiPattern(KOI_N) });
    }
  }
  function drawPad(p) {
    const ox = snapX(p.x), oy = snapY(p.y);
    for (let dy = -p.r; dy <= p.r; dy++) {
      for (let dx = -p.r; dx <= p.r; dx++) {
        if (dx * dx + dy * dy > p.r * p.r) continue;
        if (dx > 0 && dy === 0) continue; // khuyết lá sen
        cell(ox + dx * CELL_W, oy + dy * CELL_H, GLYPHS[(dx + dy + 30) % 4], 'rgba(70,165,100,.92)', 'rgba(30,100,60,.9)');
      }
    }
    if (p.f) {
      cell(ox, oy, '*', '#fff1f6', '#c2597d');
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        cell(ox + dx * CELL_W, oy + dy * CELL_H, '', '#f6a5c0', '#c2597d');
      }
    }
  }
  /* Bán kính thân (đơn vị ô): đầu nhỏ -> bụng to -> đuôi thon */
  function koiRadius(i) {
    const u = i / (KOI_N - 1);
    return u < 0.3 ? 1.5 + (u / 0.3) * 0.9 : 2.4 - ((u - 0.3) / 0.7) * 1.5;
  }
  function drawKoiFish(k, t) {
    const pts = [{ x: k.x, y: k.y }].concat(k.trail.slice(0, KOI_N - 1));
    const dir = (i) => {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
      const dx = a.x - b.x, dy = a.y - b.y, l = Math.hypot(dx, dy) || 1;
      return { x: dx / l, y: dy / l };
    };
    // Đuôi chẻ đôi, đung đưa
    const tp = pts[pts.length - 1], tf = dir(pts.length - 1), tn = { x: -tf.y, y: tf.x };
    const sway = 1 + 0.3 * Math.sin(t * 5 + k.ph);
    for (let j = 1; j <= 5; j++) {
      const w = j * 3.6 * sway;
      const offs = j <= 2 ? [-w, -w / 2, 0, w / 2, w] : [-w, -w / 2, w / 2, w];
      for (const o of offs) {
        const px = tp.x - tf.x * j * 9 + tn.x * o;
        const py = tp.y - tf.y * j * 9 + tn.y * o;
        cell(snapX(px), snapY(py), '', j > 3 ? 'rgba(255,200,150,.8)' : 'rgba(255,170,105,.9)', '');
      }
    }
    // Thân: các hình tròn chồng lên nhau, vẽ từ đuôi tới đầu
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i], r = koiRadius(i), R = Math.ceil(r), pal = KOI_PAL[k.pat[i]];
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          cell(snapX(p.x + dx * CELL_W), snapY(p.y + dy * CELL_H), GLYPHS[(i + dx * 3 + dy * 5 + 60) % 4], pal[0], pal[1]);
        }
      }
    }
    // Vây ngực (2 bên, xuôi về phía sau)
    const fp = pts[5], ff = dir(5), fn = { x: -ff.y, y: ff.x }, fr = koiRadius(5);
    for (const side of [-1, 1]) {
      for (const [out, back] of [[fr + 0.8, 6], [fr + 1.6, 16]]) {
        cell(snapX(fp.x + fn.x * side * out * 11 - ff.x * back), snapY(fp.y + fn.y * side * out * 11 - ff.y * back),
          '', 'rgba(255,226,196,.9)', '');
      }
    }
    // Mắt
    const ep = pts[1], ef = dir(1), en = { x: -ef.y, y: ef.x };
    for (const side of [-1, 1]) {
      cell(snapX(ep.x + en.x * side * 11), snapY(ep.y + en.y * side * 11), '', '#1b1b1b', '');
    }
  }
  function drawKoi(dt, t) {
    drawWaves(t, '255,255,255', 0.28, 80);
    for (const k of st.koi) {
      k.a += Math.sin(t * 0.5 + k.ph) * 0.9 * dt;
      const m = 120;
      if (k.x < m || k.x > W - m || k.y < m || k.y > H - m) {
        const ta = Math.atan2(H / 2 - k.y, W / 2 - k.x);
        let d = ta - k.a;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        k.a += d * 1.8 * dt;
      }
      k.x += Math.cos(k.a) * k.sp * dt;
      k.y += Math.sin(k.a) * k.sp * dt;
      const last = k.trail[0];
      if (!last || Math.hypot(k.x - last.x, k.y - last.y) >= KOI_STEP) k.trail.unshift({ x: k.x, y: k.y });
      if (k.trail.length > KOI_N) k.trail.pop();
      drawKoiFish(k, t);
    }
    for (const p of st.pads) drawPad(p);
  }

  /* ===================== 5. JELLYFISH ===================== */
  function initJelly() {
    st.j = [];
    const n = Math.max(3, Math.round((W * H) / 160000));
    for (let i = 0; i < n; i++) {
      st.j.push({ x: rnd(0, W), y: rnd(0, H), r: Math.floor(rnd(4, 8)), ph: rnd(0, 6.28), pink: Math.random() < 0.4 });
    }
    st.mote = [];
    for (let i = 0; i < 50; i++) st.mote.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(3, 10), ph: rnd(0, 6) });
  }
  function drawJelly(dt, t) {
    for (const m of st.mote) {
      m.y -= m.v * dt;
      if (m.y < -5) m.y = H + 5;
      ctx.fillStyle = `rgba(190,220,255,${0.2 + 0.5 * Math.abs(Math.sin(t + m.ph))})`;
      ctx.fillText('.', m.x, m.y);
    }
    const len = 10;
    for (const j of st.j) {
      const pulse = Math.max(0, Math.sin(t * 1.6 + j.ph));
      j.y -= (6 + 22 * pulse) * dt;
      j.x += Math.sin(t * 0.3 + j.ph) * 8 * dt;
      if (j.y < -(len + 3) * CELL_H) { j.y = H + 40; j.x = rnd(0, W); }
      const rr = Math.round(j.r * (1 + 0.15 * Math.sin(t * 1.6 + j.ph - 1)));
      const ry = Math.max(2, Math.round(rr * 0.7));
      const rgb = j.pink ? '255,170,210' : '160,210,255';
      const fg = j.pink ? '160,60,110' : '50,90,170';
      const ox = snapX(j.x), oy = snapY(j.y);
      for (let dy = -ry; dy <= 0; dy++) {
        for (let dx = -rr; dx <= rr; dx++) {
          if ((dx / rr) ** 2 + (dy / ry) ** 2 > 1) continue;
          cell(ox + dx * CELL_W, oy + dy * CELL_H, GLYPHS[(dx + dy + 30) % 4], `rgba(${rgb},.7)`, `rgba(${fg},.9)`);
        }
      }
      for (let ti = -rr + 1; ti <= rr - 1; ti += 2) {
        for (let k = 1; k <= len; k++) {
          const px = ox + ti * CELL_W + Math.sin(t * 2 + k * 0.5 + ti) * k * 1.3;
          ctx.fillStyle = `rgba(${rgb},${0.85 * (1 - k / len)})`;
          ctx.fillText(k % 2 ? ':' : '!', px + CELL_W / 2, oy + k * CELL_H + CELL_H / 2);
        }
      }
    }
  }

  /* ===================== 6. PAPER BOATS ===================== */
  const BOAT = [
    '     ##     ',
    '    ####    ',
    '   ######   ',
    '  ########  ',
    '            ',
    'hhhhhhhhhhhh',
    ' hhhhhhhhhh ',
    '  hhhhhhhh  ',
  ];
  const BOAT_PAL = {
    '#': ['rgba(255,255,255,.96)', 'rgba(120,150,165,.9)'],
    h: ['#ffe8c4', '#b08650'],
  };
  function initBoats() {
    st.boats = [];
    for (let i = 0; i < 4; i++) {
      st.boats.push({ x: rnd(-100, W), y: H * (0.12 + 0.2 * i), v: rnd(10, 22), ph: rnd(0, 6) });
    }
  }
  function drawBoats(dt, t) {
    drawWaves(t, '255,255,255', 0.45, 60);
    for (const b of st.boats) {
      b.x += b.v * dt;
      if (b.x > W + 20) b.x = -13 * CELL_W;
      drawSprite(BOAT, b.x, b.y + Math.sin(t * 1.2 + b.ph) * 6, BOAT_PAL);
    }
    drawWaves(t * 1.3 + 2, '255,255,255', 0.3, 95);
  }

  /* ===================== 7. FIREFLIES ===================== */
  function initFireflies() {
    st.flies = [];
    const n = Math.max(25, Math.round((W * H) / 30000));
    for (let i = 0; i < n; i++) {
      st.flies.push({ x: rnd(0, W), y: rnd(0, H), a: rnd(0, 6.28), sp: rnd(8, 24), ph: rnd(0, 6.28), bl: rnd(0.6, 1.8) });
    }
  }
  function drawFireflies(dt, t) {
    ctx.font = '13px ui-monospace, Menlo, Consolas, monospace';
    for (const f of st.flies) {
      f.a += (Math.random() - 0.5) * 2 * dt;
      f.x += Math.cos(f.a) * f.sp * dt;
      f.y += Math.sin(f.a) * f.sp * dt;
      if (f.x < -10) f.x = W + 10;
      if (f.x > W + 10) f.x = -10;
      if (f.y < -10) f.y = H + 10;
      if (f.y > H + 10) f.y = -10;
      const glow = Math.max(0, Math.sin(t * f.bl + f.ph));
      if (glow < 0.05) continue;
      ctx.save();
      ctx.shadowColor = 'rgba(214,255,106,0.9)';
      ctx.shadowBlur = 12 * glow;
      ctx.fillStyle = `rgba(214,255,106,${0.25 + 0.75 * glow})`;
      ctx.fillText(glow > 0.6 ? '*' : '·', f.x, f.y);
      ctx.restore();
    }
  }

  /* ===================== 8. MOONLIT ===================== */
  function initMoon() {
    st.stars = [];
    const n = Math.round((W * H) / 9000);
    for (let i = 0; i < n; i++) {
      st.stars.push({ x: rnd(0, W), y: rnd(0, H), ph: rnd(0, 6.28), sp: rnd(0.5, 2) });
    }
    st.moon = [];
    const R = 7;
    for (let y = -R; y <= R; y++) {
      for (let x = -R; x <= R; x++) {
        const inBig = x * x + y * y <= R * R;
        const inCut = (x - 3) ** 2 + (y + 2) ** 2 <= 36;
        if (inBig && !inCut) st.moon.push({ x, y, c: GLYPHS[(Math.random() * 4) | 0] });
      }
    }
  }
  function drawMoon(dt, t) {
    for (const s of st.stars) {
      const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
      ctx.fillStyle = `rgba(230,235,255,${a})`;
      ctx.fillText(a > 0.8 ? '*' : a > 0.5 ? '+' : '.', s.x, s.y);
    }
    const mx = snapX(W * 0.78), my = snapY(H * 0.2);
    for (const c of st.moon) {
      cell(mx + c.x * CELL_W, my + c.y * CELL_H, c.c, 'rgba(255,240,190,0.92)', 'rgba(150,130,70,0.9)');
    }
  }

  /* ===================== 9. EMBER (núi lửa + tàn lửa) ===================== */
  const VOLC_ROWS = 10;
  function initEmber() {
    st.parts = [];
    const n = Math.max(40, Math.round((W * H) / 14000));
    for (let i = 0; i < n; i++) st.parts.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(18, 50), sw: rnd(6, 20), ph: rnd(0, 6.28) });
    st.sparks = [];
    st.next = 1;
  }
  function drawEmber(dt, t) {
    for (const p of st.parts) {
      p.y -= p.v * dt;
      if (p.y < -10) { p.y = H + 10; p.x = rnd(0, W); }
      const a = Math.min(1, 0.25 + (p.y / H) * 1.1);
      ctx.fillStyle = `rgba(255,${100 + ((p.y / H) * 100) | 0},40,${a})`;
      ctx.fillText(p.y > H * 0.6 ? '*' : p.y > H * 0.3 ? '+' : '.', p.x + Math.sin(t + p.ph) * p.sw, p.y);
    }
    const cx = snapX(W * 0.72), baseY = snapY(H - 30);
    for (let r = 0; r < VOLC_ROWS; r++) {
      const half = 2 + Math.floor(r * 1.4);
      const y = baseY - (VOLC_ROWS - r) * CELL_H;
      for (let dx = -half; dx <= half; dx++) {
        const lava = r === 0 || ((dx === Math.round(-r * 0.5) || dx === Math.round(r * 0.9)) && Math.sin(t * 3 - r * 0.6) > -0.3);
        if (lava) {
          const g = 80 + ((Math.sin(t * 4 - r + dx) * 0.5 + 0.5) * 120 | 0);
          cell(cx + dx * CELL_W, y, GLYPHS[(r + dx + 40) % 4], `rgba(255,${g},20,.95)`, '#ffe29a');
        } else {
          cell(cx + dx * CELL_W, y, GLYPHS[(r + dx + 40) % 4], '#2a1410', '#6a2e1f');
        }
      }
    }
    st.next -= dt;
    if (st.next <= 0) {
      st.next = rnd(1.5, 3.5);
      for (let i = 0; i < 24; i++) {
        st.sparks.push({ x: cx + CELL_W / 2, y: baseY - VOLC_ROWS * CELL_H, vx: rnd(-70, 70), vy: rnd(-230, -120), life: rnd(1.6, 2.4), l0: 2.4 });
      }
    }
    for (let i = st.sparks.length - 1; i >= 0; i--) {
      const s = st.sparks[i];
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 160 * dt; s.life -= dt;
      if (s.life <= 0 || s.y > H) { st.sparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(255,${130 + (s.life / s.l0) * 100 | 0},40,${Math.min(1, s.life)})`;
      ctx.fillText(s.life > 1.2 ? '*' : '+', s.x, s.y);
    }
  }

  /* ===================== 10. BLOOD MOON ===================== */
  const BAT_A = ['#       #', '##  #  ##', ' ## # ## ', '   ###   '];
  const BAT_B = ['   ###   ', ' ## # ## ', '##  #  ##', '#       #'];
  const BAT_PAL = { '#': ['#0d0507', '#7a1a1a'] };
  function initBlood() {
    st.stars = [];
    const n = Math.round((W * H) / 14000);
    for (let i = 0; i < n; i++) st.stars.push({ x: rnd(0, W), y: rnd(0, H), ph: rnd(0, 6.28), sp: rnd(0.5, 2) });
    st.moon = [];
    const R = 9;
    for (let dy = -R - 2; dy <= R + 2; dy++) {
      for (let dx = -R - 2; dx <= R + 2; dx++) {
        const d = Math.hypot(dx * CELL_W, dy * CELL_H) / 11;
        if (d <= R) st.moon.push({ dx, dy, dark: Math.random() < 0.15, glow: false });
        else if (d <= R + 1.8) st.moon.push({ dx, dy, dark: false, glow: true });
      }
    }
    st.bats = [];
    for (let i = 0; i < 5; i++) {
      st.bats.push({ x: rnd(0, W), y: rnd(H * 0.1, H * 0.7), v: rnd(40, 80) * (Math.random() < 0.5 ? 1 : -1), ph: rnd(0, 6.28) });
    }
  }
  function drawBlood(dt, t) {
    for (const s of st.stars) {
      ctx.fillStyle = `rgba(255,200,200,${0.15 + 0.4 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))})`;
      ctx.fillText('.', s.x, s.y);
    }
    const mx = snapX(W * 0.72), my = snapY(H * 0.28);
    for (const c of st.moon) {
      const px = mx + c.dx * CELL_W, py = my + c.dy * CELL_H;
      if (c.glow) cell(px, py, '', 'rgba(220,40,30,.18)', '');
      else cell(px, py, GLYPHS[(c.dx + c.dy + 40) % 4], c.dark ? '#8e1a14' : '#c4261d', '#6e100c');
    }
    for (const b of st.bats) {
      b.x += b.v * dt;
      if (b.v > 0 && b.x > W + 20) b.x = -10 * CELL_W;
      if (b.v < 0 && b.x < -10 * CELL_W) b.x = W + 20;
      const frameA = Math.floor(t * 4 + b.ph) % 2 === 0;
      drawSprite(frameA ? BAT_A : BAT_B, b.x, b.y + Math.sin(t * 1.5 + b.ph) * 10, BAT_PAL);
    }
  }

  /* ===================== 11. NEON RAIN ===================== */
  const RAIN_CHARS = '01<>/\\|{}[]:;=+*#';
  const rainCh = () => RAIN_CHARS[(Math.random() * RAIN_CHARS.length) | 0];
  function newDrop(c, y) {
    const len = Math.floor(rnd(8, 22));
    return { c, x: c * CELL_W * 2, y, v: rnd(80, 220), len, ch: Array.from({ length: len }, rainCh) };
  }
  function initNeon() {
    st.cols = [];
    const n = Math.ceil(W / (CELL_W * 2));
    for (let c = 0; c < n; c++) st.cols.push(newDrop(c, rnd(-H * 0.5, H)));
    st.gInit = false;
    st.bands = null;
  }
  function drawNeon(dt, t) {
    if (!st.gInit) { st.gInit = true; st.glitchNext = t + rnd(2, 4); st.glitchEnd = 0; }
    for (let i = 0; i < st.cols.length; i++) {
      let d = st.cols[i];
      d.y += d.v * dt;
      if (d.y - d.len * CELL_H > H) d = st.cols[i] = newDrop(d.c, -rnd(0, 300));
      for (let k = 0; k < d.len; k++) {
        const yy = d.y - k * CELL_H;
        if (yy < -CELL_H || yy > H) continue;
        if (Math.random() < 0.02) d.ch[k] = rainCh();
        ctx.fillStyle = k === 0 ? 'rgba(220,255,235,1)' : `rgba(0,255,120,${0.9 * (1 - k / d.len)})`;
        ctx.fillText(d.ch[k], d.x + CELL_W / 2, snapY(yy) + CELL_H / 2);
      }
    }
    if (t >= st.glitchNext) {
      st.glitchEnd = t + rnd(0.2, 0.45);
      st.glitchNext = t + rnd(3, 7);
      st.bands = null;
    }
    if (t < st.glitchEnd) {
      if (!st.bands || Math.random() < 0.25) {
        st.bands = [];
        const n = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          st.bands.push({ x: snapX(rnd(0, W * 0.7)), y: snapY(rnd(0, H)), w: Math.floor(rnd(10, 45)), h: 1 + Math.floor(Math.random() * 2) });
        }
      }
      for (const b of st.bands) {
        for (let j = 0; j < b.h; j++) {
          for (let i = 0; i < b.w; i++) {
            cell(b.x + i * CELL_W, b.y + j * CELL_H, '#%&@01'[(Math.random() * 6) | 0], 'rgba(255,30,60,.28)', 'rgba(255,90,110,.95)');
          }
        }
      }
    }
  }

  /* ===================== 12. AURORA ===================== */
  function initAurora() {
    st.stars = [];
    const n = Math.round((W * H) / 12000);
    for (let i = 0; i < n; i++) st.stars.push({ x: rnd(0, W), y: rnd(0, H), ph: rnd(0, 6.28), sp: rnd(0.5, 2) });
  }
  function drawAurora(dt, t) {
    for (const s of st.stars) {
      ctx.fillStyle = `rgba(230,240,255,${0.15 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))})`;
      ctx.fillText('.', s.x, s.y);
    }
    const layers = [{ rgb: '80,255,160', base: 0.28, ph: 0 }, { rgb: '170,110,255', base: 0.4, ph: 2 }];
    for (const L of layers) {
      for (let x = 0; x < W; x += CELL_W) {
        const cy = H * L.base + Math.sin(x * 0.008 + t * 0.25 + L.ph) * H * 0.07 + Math.sin(x * 0.021 - t * 0.17 + L.ph) * H * 0.035;
        const half = Math.round(4 + 4 * (0.5 + 0.5 * Math.sin(x * 0.03 + t * 0.5 + L.ph)));
        for (let k = -half; k <= half; k++) {
          const a = 0.6 * (1 - Math.abs(k) / (half + 1)) * (0.7 + 0.3 * (k / half));
          cell(x, snapY(cy + k * CELL_H), k % 2 ? ':' : 't', `rgba(${L.rgb},${a * 0.55})`, `rgba(255,255,255,${a * 0.5})`);
        }
      }
    }
  }

  /* ===================== 13. SNOWFALL ===================== */
  const SNOWMAN = [
    '    hhh    ',
    '    hhh    ',
    '  hhhhhhh  ',
    '   wewew   ',
    '   wwcww   ',
    '  sssssss  ',
    ' awwwkwwwa ',
    ' wwwwwwwww ',
    ' wwwwkwwww ',
    '  wwwwwww  ',
  ];
  const SNOW_PAL = {
    w: ['#ffffff', '#9fb0c0'], h: ['#2b2b33', '#555566'], e: ['#222222', '#222222'],
    c: ['#ff8a3d', '#a64a12'], s: ['#e8402b', '#7d1a0f'], k: ['#333333', '#333333'], a: ['#8b5a2b', '#5a3a1a'],
  };
  function initSnow() {
    st.flakes = [];
    const n = Math.max(60, Math.round((W * H) / 6000));
    for (let i = 0; i < n; i++) st.flakes.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(15, 50), sw: rnd(8, 30), ph: rnd(0, 6.28), big: Math.random() < 0.3 });
  }
  function drawSnow(dt, t) {
    for (const f of st.flakes) {
      f.y += f.v * dt;
      if (f.y > H + 10) { f.y = -10; f.x = rnd(0, W); }
      const x = f.x + Math.sin(t * 0.8 + f.ph) * f.sw;
      if (f.big) cell(snapX(x), snapY(f.y), '*', 'rgba(225,238,252,.92)', 'rgba(90,130,180,.9)');
      else { ctx.fillStyle = 'rgba(120,150,190,.7)'; ctx.fillText('.', x, f.y); }
    }
    drawSprite(SNOWMAN, W * 0.1, H - SNOWMAN.length * CELL_H - 10, SNOW_PAL);
  }

  /* ===================== 14. DEEP SPACE ===================== */
  const SHIP = [
    '    ww     ',
    '  wwwwwww  ',
    'fwwwwwwwwwn',
    '  wwwwwww  ',
    '    ww     ',
  ];
  function drawPlanet(cx, cy, R, bands, ring) {
    const ringCells = (front) => {
      if (!ring) return;
      for (let dy = -4; dy <= 4; dy++) {
        if (front ? dy <= 0 : dy > 0) continue;
        for (let dx = -Math.ceil(R * 2.1); dx <= Math.ceil(R * 2.1); dx++) {
          const rr = Math.hypot(dx, dy / 0.3);
          if (rr < R * 1.3 || rr > R * 2) continue;
          cell(cx + dx * CELL_W, cy + dy * CELL_H, ':', 'rgba(240,215,170,.9)', 'rgba(150,120,80,.9)');
        }
      }
    };
    ringCells(false);
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        if (Math.hypot(dx * CELL_W, dy * CELL_H) > R * 11) continue;
        const b = bands[(dy + R) % bands.length];
        cell(cx + dx * CELL_W, cy + dy * CELL_H, GLYPHS[(dx + dy + 40) % 4], b[0], b[1]);
      }
    }
    ringCells(true);
  }
  function initSpace() {
    st.stars = [];
    const n = Math.round((W * H) / 8000);
    for (let i = 0; i < n; i++) st.stars.push({ x: rnd(0, W), y: rnd(0, H), ph: rnd(0, 6.28), sp: rnd(0.5, 2) });
    st.ship = { x: rnd(-100, W * 0.5), y: rnd(H * 0.15, H * 0.85), v: 45 };
    st.shoot = [];
    st.sn = rnd(2, 4);
  }
  function drawSpace(dt, t) {
    for (const s of st.stars) {
      const a = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
      ctx.fillStyle = `rgba(230,235,255,${a})`;
      ctx.fillText(a > 0.8 ? '*' : a > 0.5 ? '+' : '.', s.x, s.y);
    }
    drawPlanet(snapX(W * 0.18), snapY(H * 0.3), 7,
      [['#e0a064', '#8a5a2a'], ['#c98349', '#7a4a22'], ['#efc08a', '#9a6a3a']], true);
    drawPlanet(snapX(W * 0.82), snapY(H * 0.72), 3, [['#5aa0ff', '#1f4f9a'], ['#7dbbff', '#2a5fa8']], false);
    st.sn -= dt;
    if (st.sn <= 0) {
      st.sn = rnd(3, 6);
      st.shoot.push({ x: rnd(W * 0.2, W), y: rnd(0, H * 0.4), life: 0.7 });
    }
    for (let i = st.shoot.length - 1; i >= 0; i--) {
      const s = st.shoot[i];
      s.x -= 320 * dt; s.y += 160 * dt; s.life -= dt;
      if (s.life <= 0) { st.shoot.splice(i, 1); continue; }
      for (let k = 0; k < 7; k++) {
        ctx.fillStyle = `rgba(255,255,255,${(1 - k / 7) * Math.min(1, s.life * 2)})`;
        ctx.fillText(k === 0 ? '*' : k < 3 ? '-' : '.', s.x + k * 12, s.y - k * 6);
      }
    }
    const sh = st.ship;
    sh.x += sh.v * dt;
    if (sh.x > W + 20) { sh.x = -12 * CELL_W; sh.y = rnd(H * 0.15, H * 0.85); }
    drawSprite(SHIP, sh.x, sh.y, {
      w: ['#d9e2f2', '#6b7a99'], n: ['#e8402b', '#7d1a0f'],
      f: Math.floor(t * 10) % 2 ? ['#ff9a3a', '#ffffff'] : ['#ffd24a', '#ffffff'],
    });
  }

  /* ===================== 15. SAKURA ===================== */
  function initSakura() {
    st.petals = [];
    const n = Math.max(40, Math.round((W * H) / 9000));
    for (let i = 0; i < n; i++) st.petals.push({ x: rnd(0, W), y: rnd(-H, H), v: rnd(18, 40), sw: rnd(15, 40), ph: rnd(0, 6.28), c: Math.random() < 0.5 ? 0 : 1 });
    st.branch = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      st.branch.push({ x: snapX(W - u * W * 0.4), y: snapY(H * 0.05 + u * H * 0.2 + Math.sin(u * 5) * 10) });
    }
    st.blossoms = [];
    for (let i = 2; i <= 40; i += 4) {
      const b = st.branch[i];
      st.blossoms.push({ x: snapX(b.x + rnd(-20, 20)), y: snapY(b.y + rnd(-30, 30)), r: Math.floor(rnd(2, 4)) });
    }
  }
  const PINKS = [['rgba(255,183,213,.95)', 'rgba(190,80,120,.9)'], ['rgba(255,214,230,.95)', 'rgba(190,80,120,.9)']];
  function drawSakura(dt, t) {
    for (const b of st.branch) {
      cell(b.x, b.y, '', '#6b4430', '');
      cell(b.x, b.y + CELL_H, '', '#6b4430', '');
    }
    for (const bl of st.blossoms) {
      for (let dy = -bl.r; dy <= bl.r; dy++) {
        for (let dx = -bl.r; dx <= bl.r; dx++) {
          if (dx * dx + dy * dy > bl.r * bl.r) continue;
          const p = PINKS[(dx + dy + 20) % 2];
          cell(bl.x + dx * CELL_W, bl.y + dy * CELL_H, 'o', p[0], p[1]);
        }
      }
    }
    for (const p of st.petals) {
      p.y += p.v * dt;
      if (p.y > H + 10) { p.y = -10; p.x = rnd(0, W); }
      const pal = PINKS[p.c];
      cell(snapX(p.x + Math.sin(t * 0.9 + p.ph) * p.sw), snapY(p.y), GLYPHS[(p.c + Math.floor(p.ph)) % 4], pal[0], pal[1]);
    }
  }

  /* ===================== DANH SÁCH THEME ===================== */
  const SCENES = {
    claude:    { name: 'Claude Code', emoji: '🎆', tint: ['#3b2016', '#120a07'], init: initClaude,    draw: drawClaude },
    cloud:     { name: 'Cloud Drift', emoji: '☁️', tint: ['#cfe6ff', '#74b0ee'], init: initCloud,     draw: drawCloud },
    honu:      { name: 'Honu Lagoon', emoji: '🐢', tint: ['#9ff0de', '#1e93a8'], init: initHonu,      draw: drawHonu },
    koi:       { name: 'Koi Pond',    emoji: '🐟', tint: ['#8fd4c0', '#2b7a78'], init: initKoi,       draw: drawKoi },
    jelly:     { name: 'Jellyfish',   emoji: '🪼', tint: ['#0d3a73', '#020b24'], init: initJelly,     draw: drawJelly },
    boats:     { name: 'Paper Boats', emoji: '⛵', tint: ['#d8f6ee', '#46b4b0'], init: initBoats,     draw: drawBoats },
    fireflies: { name: 'Fireflies',   emoji: '✨', tint: ['#06120c', '#12351f'], init: initFireflies, draw: drawFireflies },
    moon:      { name: 'Moonlit',     emoji: '🌙', tint: ['#0b1230', '#243468'], init: initMoon,      draw: drawMoon },
    ember:     { name: 'Ember',       emoji: '🌋', tint: ['#3a0f06', '#050101'], init: initEmber,     draw: drawEmber },
    blood:     { name: 'Blood Moon',  emoji: '🦇', tint: ['#3a0606', '#0a0102'], init: initBlood,     draw: drawBlood },
    neon:      { name: 'Neon Rain',   emoji: '🌧️', tint: ['#00240f', '#000a05'], init: initNeon,      draw: drawNeon },
    aurora:    { name: 'Aurora',      emoji: '🌌', tint: ['#06242a', '#150a3a'], init: initAurora,    draw: drawAurora },
    snow:      { name: 'Snowfall',    emoji: '⛄', tint: ['#cfe3f7', '#8fb0d4'], init: initSnow,      draw: drawSnow },
    space:     { name: 'Deep Space',  emoji: '🚀', tint: ['#050818', '#1a0b38'], init: initSpace,     draw: drawSpace },
    sakura:    { name: 'Sakura',      emoji: '🌸', tint: ['#ffe6ef', '#f4a9c7'], init: initSakura,    draw: drawSakura },
    off:       { name: 'Tắt',         emoji: '🚫', tint: null,                   init() {},            draw() {} },
  };

  let themeKey = store.get('theme', 'cloud');
  if (!SCENES[themeKey]) themeKey = 'cloud';
  let strength = store.get('strength', 0.5); // 0.1 - 1

  /* ===================== ĐIỀU PHỐI ===================== */
  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initScene();
  }
  window.addEventListener('resize', resize);

  function initScene() {
    st = {};
    SCENES[themeKey].init();
  }

  function applyTint() {
    const th = SCENES[themeKey];
    if (!th.tint) { tint.style.opacity = 0; return; }
    tint.style.background = `linear-gradient(180deg, ${th.tint[0]}, ${th.tint[1]})`;
    tint.style.opacity = (strength * 0.35).toFixed(3);
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, W, H);
    if (themeKey === 'off') return;
    ctx.globalAlpha = strength;
    ctx.font = FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    SCENES[themeKey].draw(dt, now / 1000);
    ctx.globalAlpha = 1;
  }

  function setTheme(key) {
    themeKey = key;
    store.set('theme', key);
    applyTint();
    initScene();
    renderPanel();
  }

  /* ===================== BẢNG CHỌN THEME (Shadow DOM) ===================== */
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;z-index:2147483647;';
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  root.innerHTML = `
    <style>
      * { box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
      .btn { position: fixed; bottom: ${BTN_POS.bottom}; left: ${BTN_POS.left}; width: 34px; height: 34px;
        border-radius: 50%; border: 0; cursor: pointer; background: rgba(255,255,255,.9);
        box-shadow: 0 2px 10px rgba(0,0,0,.25); font-size: 17px; opacity: .55; transition: opacity .2s; }
      .btn:hover { opacity: 1; }
      .panel { position: fixed; bottom: 54px; left: 74px; width: 400px; max-width: calc(100vw - 90px);
        padding: 12px; border-radius: 14px; background: #fff; color: #222;
        box-shadow: 0 8px 30px rgba(0,0,0,.3); display: none; }
      .panel.open { display: block; }
      .head { display: flex; justify-content: space-between; font-size: 12px; color: #777; margin-bottom: 8px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-height: 60vh; overflow-y: auto; padding: 2px; }
      .th { cursor: pointer; text-align: center; font-size: 11px; color: #555; }
      .th .pv { height: 46px; border-radius: 8px; border: 2px solid transparent; margin-bottom: 4px;
        display: flex; align-items: center; justify-content: center; font-size: 20px; }
      .th:hover .pv { border-color: #bcd3f7; }
      .th.on .pv { border-color: #3b82f6; }
      .th.on { color: #111; font-weight: 600; }
      .row { margin-top: 10px; font-size: 12px; color: #555; display: flex; align-items: center; gap: 8px; }
      .row input { flex: 1; }
    </style>
    <button class="btn" title="Đổi hình nền (Ctrl+Alt+T)">🎨</button>
    <div class="panel">
      <div class="head"><span>/theme · ASCII wallpapers</span><span>Ctrl+Alt+T</span></div>
      <div class="grid"></div>
      <div class="row">Độ đậm <input type="range" min="0.1" max="1" step="0.05"></div>
    </div>
  `;
  const btn = root.querySelector('.btn');
  const panel = root.querySelector('.panel');
  const grid = root.querySelector('.grid');
  const slider = root.querySelector('input');

  function renderPanel() {
    grid.innerHTML = '';
    for (const [key, th] of Object.entries(SCENES)) {
      const d = document.createElement('div');
      d.className = 'th' + (key === themeKey ? ' on' : '');
      const bg = th.tint
        ? `linear-gradient(${th.tint[0]}, ${th.tint[1]})`
        : 'repeating-linear-gradient(45deg,#eee,#eee 6px,#ddd 6px,#ddd 12px)';
      d.innerHTML = `<div class="pv" style="background:${bg}">${th.emoji}</div>${th.name}`;
      d.onclick = () => setTheme(key);
      grid.appendChild(d);
    }
    slider.value = strength;
  }

  slider.addEventListener('input', () => {
    strength = parseFloat(slider.value);
    store.set('strength', strength);
    applyTint();
  });
  btn.onclick = () => panel.classList.toggle('open');
  window.addEventListener('keydown', (e) => {
    if (HOTKEY(e)) { e.preventDefault(); panel.classList.toggle('open'); }
    if (e.key === 'Escape') panel.classList.remove('open');
  });

  /* ===================== KHỞI ĐỘNG ===================== */
  renderPanel();
  applyTint();
  resize();
  requestAnimationFrame(frame);
})();
