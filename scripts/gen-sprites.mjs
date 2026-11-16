/* Builds the Durva pixel sprites (32x48 px) from the hand-made head and torso in public/char/durva-idle.png.
   Arms and legs are redrawn from joint positions so every limb stays joined to the body in every frame. */
import fs from 'node:fs';
import zlib from 'node:zlib';

const DIR = new URL('../assets/sprites/', import.meta.url);
const U = 24, W = 32, H = 48;

function readPng(file) {
  const b = fs.readFileSync(file); let p = 8, w = 0, h = 0; const idat = [];
  while (p < b.length) { const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8); if (type === 'IHDR') { w = b.readUInt32BE(p + 8); h = b.readUInt32BE(p + 12); } if (type === 'IDAT') idat.push(b.subarray(p + 8, p + 8 + len)); p += 12 + len; }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)]; for (let x = 0; x < stride; x++) { const v = raw[y * (stride + 1) + 1 + x], a = x >= bpp ? out[y * stride + x - bpp] : 0, u = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
    out[y * stride + x] = (f === 0 ? v : f === 1 ? v + a : f === 2 ? v + u : f === 3 ? v + ((a + u) >> 1) : v + (() => { const pp = a + u - c, pa = Math.abs(pp - a), pb = Math.abs(pp - u), pc = Math.abs(pp - c); return pa <= pb && pa <= pc ? a : pb <= pc ? u : c; })()) & 255; } }
  return { w, h, px: out };
}
const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
function toGrid(png) { const g = []; for (let y = 0; y < H; y++) { g.push([]); for (let x = 0; x < W; x++) { const i = ((y * U + 12) * png.w + x * U + 12) * 4; g[y].push(png.px[i + 3] < 128 ? null : hex(png.px[i], png.px[i + 1], png.px[i + 2])); } } return g; }

const base = toGrid(readPng(new URL('../../scripts/durva-src/durva-idle.png', DIR)));
const hpHead = toGrid(readPng(new URL('../../scripts/durva-src/durva-headphones.png', DIR)));
const SKIN = base[14][14], SKIN_D = base[24][10] || '#af8c66', PANTS = base[34][10], INK = base[34][7], SHOE = base[44][9], SOLE = base[46][9], HAIR = base[4][12], GOLD = base[26][16] || '#c4a23a';
const STICK = '#c4a23a';

const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

/* head and torso: rows 0..27, columns 8..24, optionally shifted down (when seated) */
function addHP(g, dy, dx) {
  const put = (x, y, c) => { if (inb(x + dx, y + dy)) g[y + dy][x + dx] = c; }, cells = [], BAND = '#58585f', RED = '#e0122d', DK = '#960a1c';
  const add = (x, y, c) => { cells.push([x, y]); put(x, y, c); };
  for (let x = 11; x <= 20; x++) add(x, 3, BAND); for (const x of [9, 10, 21, 22]) add(x, 4, BAND); for (let y = 5; y <= 8; y++) for (const x of [9, 22]) add(x, y, BAND);
  const cup = (x0, mirror) => { for (let y = 8; y <= 13; y++) for (let k = 0; k < 4; k++) { if ((y === 8 || y === 13) && (k === 0 || k === 3)) continue; const x = mirror ? x0 + 3 - k : x0 + k; add(x, y, k === 0 ? '#ff6a6a' : k === 3 ? DK : RED); } };
  cup(7, false); cup(21, true);
  const has = new Set(cells.map(q => q.join(','))); for (const [x, y] of cells) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has.has((x + ax) + ',' + (y + ay)) && !(g[y + ay + dy] && g[y + ay + dy][x + ax + dx] && [BAND, RED, DK, '#ff6a6a'].includes(g[y + ay + dy][x + ax + dx]))) put(x + ax, y + ay, INK);
}
function body(g, dy, hp, dx = 0) {
  for (let y = 0; y < 28; y++) for (let x = 8; x <= 24; x++) { let c = base[y][x]; if (c && (x <= 9 || x >= 22 || x === 8 || x === 24) && y >= 18) { /* the hand-drawn idle arms hang here; arms are redrawn per frame, so drop them */ const skin = c === SKIN || c === '#b08c65', edge = c === INK || c === HAIR; if (skin) c = y <= 24 ? '#1a1a1d' : null; else if (edge && (x === 8 || x === 24) && (y === 18 || y >= 25 || x === 24)) c = null; } if (c && inb(x + dx, y + dy)) g[y + dy][x + dx] = c; }
  /* a full-width brown stripe under the mouth read as a mask line across the face */
  for (let x = 11; x <= 20; x++) if (g[12 + dy][x + dx] === '#b08c65') g[12 + dy][x + dx] = SKIN;
  /* sideburn pixels at the jaw corners are hair, as drawn */
  for (const x of [11, 20]) if (g[12 + dy][x + dx] === SKIN) g[12 + dy][x + dx] = HAIR;
  /* loose ink specks beside the right cheek */
  for (const y of [11, 14]) if (g[y + dy][22 + dx] === INK) g[y + dy][22 + dx] = null;
  /* the white earbud pixels by the right ear */
  for (let y = 9; y <= 15; y++) for (let x = 21; x <= 24; x++) if (g[y + dy][x + dx] === '#f5f5f2') g[y + dy][x + dx] = null;
  if (hp) addHP(g, dy, dx);
}
function blink(g, dy) { for (let x = 10; x <= 18; x++) if (g[11 + dy][x] === INK) g[11 + dy][x] = SKIN_D; }

function stampPath(mask, pts, r) {
  for (let s = 0; s < pts.length - 1; s++) { const [ax, ay] = pts[s], [bx, by] = pts[s + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 4));
    for (let i = 0; i <= n; i++) { const cx = ax + (bx - ax) * i / n, cy = ay + (by - ay) * i / n; for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if (inb(x, y) && Math.hypot(x - cx, y - cy) <= r) mask.add(x + ',' + y); } }
}
function layer(g, mask, color, over = false, extra = {}) {
  const m = [...mask].map(k => k.split(',').map(Number));
  for (const [x, y] of m) g[y][x] = extra[x + ',' + y] || color;
  for (const [x, y] of m) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (inb(nx, ny) && !mask.has(nx + ',' + ny) && !g[ny][nx]) g[ny][nx] = INK; }
}
function ik(a, t, l1, l2, side, wx, wy) {
  let dx = t[0] - a[0], dy = t[1] - a[1], d = Math.hypot(dx, dy) || 1; const mx = l1 + l2 - .01; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
  const k = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - k * k)), bx = a[0] + dx * k / d, by = a[1] + dy * k / d, px = -dy / d * h, py = dx / d * h, e1 = [bx + px, by + py], e2 = [bx - px, by - py], sc = e => side * e[0] * wx + e[1] * wy;
  return { e: sc(e1) < sc(e2) ? e2 : e1, h: [a[0] + dx, a[1] + dy] };
}

function legs(g, p) {
  const hips = [[12, p.hy], [20, p.hy]];
  (p.top ? [1, 0] : [0, 1]).forEach(i => { const hp = hips[i], ft = p.f[i], side = i ? 1 : -1, kn = p.k && p.k[i] ? p.k[i] : (() => { const d = Math.hypot(ft[0] - hp[0], ft[1] - 3 - hp[1]), l = p.ll || Math.max(d / 2 * 1.002, 5); return ik(hp, [ft[0], ft[1] - 3], l, l, side, 1, 0).e; })(), mask = new Set(), ex = {};
    stampPath(mask, [hp, kn, [ft[0], ft[1] - 3]], 2.6);
    for (let y = ft[1] - 2; y <= ft[1]; y++) for (let x = ft[0] - 3; x <= ft[0] + 3; x++) { if (!inb(x, y)) continue; mask.add(x + ',' + y); ex[x + ',' + y] = y === ft[1] ? SOLE : SHOE; }
    layer(g, mask, PANTS, false, ex); });
}
function arms(g, p) {
  const bx = p.bx || 0, sh = [[7.5 + bx, 19.5 + p.dy], [24.5 + bx, 19.5 + p.dy]];
  [0, 1].forEach(i => { const side = i ? 1 : -1, r = (() => { const d = Math.hypot(p.h[i][0] - sh[i][0], p.h[i][1] - sh[i][1]), l = p.al || Math.min(6.6, Math.max(d / 2 * 1.05, 4)); if (p.el && p.el[i]) return { e: p.el[i], h: p.h[i] }; if (p.h[i] === HANG[i]) return { e: [(sh[i][0] + p.h[i][0]) / 2, (sh[i][1] + p.h[i][1]) / 2], h: p.h[i] }; return ik(sh[i], p.h[i], l, l, side, 1, 1.5); })(), mask = new Set();
    stampPath(mask, [sh[i], r.e, r.h], p.h[i] === HANG[i] ? 1.25 : 1.75); const hx = Math.round(r.h[0]), hy = Math.round(r.h[1]); for (let y = hy - 1; y <= hy + 1; y++) for (let x = hx - 1; x <= hx + 1; x++) if (inb(x, y)) mask.add(x + ',' + y);
    layer(g, mask, SKIN, true);
    if (p.glove) { /* big round red boxing glove: 6x6, highlight, thumb seam, white cuff, ink outline */
      const R = ['.rrrr.', 'rhhrrr', 'rhrrrr', 'rrrrrr', 'rrTTrr', '.rrrr.'], cx = hx, cy = hy - 1, put = (x, y, c) => { if (inb(x, y)) g[y][x] = c; }, cells = [];
      for (let j = 0; j < 6; j++) for (let k = 0; k < 6; k++) { const c = R[j][k]; if (c === '.') continue; const x = cx - 3 + (i ? 5 - k : k), y = cy - 3 + j; cells.push([x, y]); put(x, y, c === 'h' ? '#ff8a8a' : c === 'T' ? '#8f0a1c' : (j === 5 || k === (i ? 0 : 5)) ? '#b80f20' : '#e0122d'); }
      for (let k = -2; k <= 1; k++) { cells.push([cx + k, cy + 3]); put(cx + k, cy + 3, '#f4f2ec'); }
      const has = new Set(cells.map(q => q.join(','))); for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has.has((x + dx) + ',' + (y + dy))) put(x + dx, y + dy, INK); }
    if (p.stick && p.stick[i]) { const s = p.stick[i], sx = hx + (i ? -1 : 1), tip = [[sx, hy - 1], [sx + (i ? -1 : 1), hy - 2], [sx + (i ? -2 : 2), hy - 3], [sx + (i ? -3 : 3), hy - 4], [sx + (i ? -4 : 4), hy - 5]].slice(0, s); for (const [x, y] of tip) if (inb(x, y)) g[y][x] = STICK; } });
}

function make(p, cat) {
  const g = blank(); p = { dy: 0, hy: 28, f: [[11, 46], [21, 46]], ...p };
  if (cat) tail(g); if (p.chair || p.desk) chair(g);
  legs(g, p); body(g, p.dy, p.hp, p.bx || 0); arms(g, p); if (p.blink) blink(g, p.dy); if (p.lap) laptop(g); if (p.mug !== undefined) mug(g, p.mug); if (p.book !== undefined) book(g, p.book); if (p.zzz !== undefined) zzz(g, p.zzz); if (p.bulb) bulb(g); if (p.sweat) sweat(g); if (p.heart) heart(g); if (p.eyes) shut(g, p.dy);
  if (p.coffee !== undefined) coffee(g, p.coffee); if (p.shades) shades(g, p.dy); if (p.wink) wink(g, p.dy); if (p.web) web(g); if (p.rose) rose(g); if (p.phone) phone(g); if (p.q) question(g); if (p.spark) sparkle(g);
  if (p.hearteyes) heartEyes(g, p.dy); if (p.mask) mask(g, p.dy);
  if (p.bag) beanbag(g); if (p.desk) desk(g);
  if (p.pot) teapot(g); if (p.lamp) lamp(g);
  if (p.item) { const [k, x, y, n] = p.item; if (k === 'tea') { teacup(g, x, y); if (y > 20) steam(g, x + 2, y - 1); } else if (k === 'coffee') { coffeecup(g, x, y); if (y > 20) steam(g, x + 2, y - 1); } else if (k === 'book') openbook(g, x, y, n); else if (k === 'water') glass(g, x, y); else if (k === 'hot') { hotchoc(g, x, y); if (y > 20) steam(g, x + 2, y - 2); } else if (k === 'cookie') cookie(g, x, y, n); else if (k === 'pizza') pizza(g, x, y); }
  if (p.plate) plate(g);
  if (cat) ears(g, p.dy);
  return p.flip ? g.slice().reverse() : g;
}

/* hands are in sprite pixels: x 0..31, y 0..47 */
/* a laptop seen from behind, sat in front of him: grey lid with a small logo, hands out of sight */
function laptop(g) {
  const LID = '#b9bcc2', LID_L = '#d3d5da', BASE = '#8e9096', put = (x, y, c) => { if (inb(x, y)) g[y][x] = c; };
  for (let y = 28; y <= 36; y++) for (let x = 8; x <= 24; x++) put(x, y, y === 28 ? LID_L : LID);
  for (let x = 7; x <= 25; x++) put(x, 37, BASE);
  for (let y = 27; y <= 38; y++) for (const x of [7, 25]) if (y >= 28 && y <= 36) put(x, y, INK);
  for (let x = 7; x <= 25; x++) { put(x, 27, INK); put(x, 38, INK); }
  put(16, 32, '#f4f2ec'); put(15, 32, '#f4f2ec'); put(16, 33, '#f4f2ec'); put(15, 33, '#f4f2ec');
  /* stickers */
  const st = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
  st(9, 29, 3, 3, '#e0122d'); st(13, 29, 2, 2, '#ffc21a'); st(18, 29, 3, 2, '#22c3d6'); st(22, 30, 2, 3, '#7a2fd0');
  st(9, 34, 2, 2, '#ff5a36'); st(12, 35, 3, 1, '#f4f2ec'); st(18, 34, 3, 2, '#ffc21a'); st(22, 34, 2, 2, '#e0122d'); st(10, 31, 1, 1, '#14100e');
}

/* ---- props for the pet poses ---- */
const px = (g, x, y, c) => { if (inb(x, y)) g[y][x] = c; };
const blob = (g, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(g, x + i, y + j, c); };
const outline = (g, x, y, w, h) => { for (let i = -1; i <= w; i++) { px(g, x + i, y - 1, INK); px(g, x + i, y + h, INK); } for (let j = 0; j < h; j++) { px(g, x - 1, y + j, INK); px(g, x + w, y + j, INK); } };
/* a mug of tea: lvl 0 = held at the chest, 1 = raised to the mouth; steam above it */
function mug(g, lvl) {
  const x = lvl ? 20 : 21, y = lvl ? 10 : 22, w = 5, h = 5;
  blob(g, x, y, w, h, '#f4f2ec'); blob(g, x, y + 1, w, 1, '#e0122d'); outline(g, x, y, w, h);
  blob(g, x + w + 1, y + 1, 1, 3, INK); px(g, x + w + 2, y + 2, INK);
  blob(g, x + 1, y, 3, 1, '#a0541f');
  const sx = x + 2, sy = y - 3; px(g, sx, sy, '#dfe3e6'); px(g, sx + 1, sy - 1, '#c9cfd4'); px(g, sx, sy - 2, '#dfe3e6');
}
/* a book held open in front of the chest */
function book(g, n) {
  const x = 10, y = 20, w = 12, h = 8; blob(g, x, y, w, h, '#e0122d'); blob(g, x + 1, y + 1, 5, h - 2, '#f4f2ec'); blob(g, x + 6, y + 1, 5, h - 2, '#f4f2ec'); blob(g, x + 5, y, 2, h, '#8f0a1f'); outline(g, x, y, w, h);
  for (const j of [2, 4, 6]) { blob(g, x + 2, y + j, 3, 1, '#b9bcc2'); blob(g, x + 7, y + j, 3 - (n && j === 6 ? 1 : 0), 1, '#b9bcc2'); }
}
function zzz(g, n) { const Z = (x, y, s) => { blob(g, x, y, s, 1, '#6d6d6a'); for (let i = 0; i < s - 1; i++) px(g, x + s - 2 - i, y + 1 + i, '#6d6d6a'); blob(g, x, y + s - 1, s, 1, '#6d6d6a'); }; Z(25, 5 - (n ? 2 : 0), 3); if (n) Z(28, 1, 3); }
function bulb(g) { blob(g, 14, 0, 4, 3, '#ffc21a'); blob(g, 15, 3, 2, 1, '#8e9096'); px(g, 13, 1, '#fff3b0'); px(g, 18, 1, '#fff3b0'); px(g, 15, 0, '#fff3b0'); }
function sweat(g) { px(g, 23, 5, '#22c3d6'); blob(g, 23, 6, 1, 2, '#22c3d6'); px(g, 22, 7, '#22c3d6'); px(g, 24, 7, '#22c3d6'); }
function heart(g) { const R = '#e0122d'; for (const [x, y] of [[25, 3], [26, 3], [28, 3], [29, 3], [25, 4], [26, 4], [27, 4], [28, 4], [29, 4], [26, 5], [27, 5], [28, 5], [27, 6]]) px(g, x, y, R); }
/* eyes shut: swap the eye pixels for a flat line */
function shut(g, dy) { for (const x of [13, 18]) for (const y of [8, 9]) if (g[y + dy][x] && g[y + dy][x] !== SKIN) g[y + dy][x] = y === 9 ? INK : SKIN; }
/* a takeaway coffee cup: lid, cardboard sleeve, held at the chest (0) or raised to the mouth (1) */
function coffee(g, lvl) {
  const x = lvl ? 20 : 21, y = lvl ? 10 : 22, w = 5, h = 6;
  blob(g, x, y, w, h, '#f4f2ec'); blob(g, x, y + 2, w, 2, '#a0541f'); blob(g, x - 1, y, w + 2, 1, '#3a3a3f'); outline(g, x - 1, y, w + 2, h);
  const sx = x + 2, sy = y - 3; px(g, sx, sy, '#dfe3e6'); px(g, sx - 1, sy - 1, '#c9cfd4'); px(g, sx, sy - 2, '#dfe3e6');
}
function shades(g, dy) { blob(g, 12, 8 + dy, 3, 2, INK); blob(g, 17, 8 + dy, 3, 2, INK); px(g, 15, 8 + dy, INK); px(g, 16, 8 + dy, INK); px(g, 12, 8 + dy, '#e0122d'); px(g, 17, 8 + dy, '#e0122d'); }
function wink(g, dy) { for (const y of [8, 9]) if (g[y + dy][18] && g[y + dy][18] !== SKIN) g[y + dy][18] = y === 9 ? INK : SKIN; }
function web(g) { const pts = [[25, 18], [26, 16], [27, 14], [28, 12], [29, 10], [30, 8], [31, 6]]; for (const [x, y] of pts) px(g, x, y, '#cfd3d8'); }
function rose(g) { blob(g, 23, 17, 3, 3, '#e0122d'); px(g, 24, 18, '#8f0a1f'); for (let y = 20; y <= 26; y++) px(g, 24, y, '#2e7d32'); px(g, 25, 22, '#2e7d32'); }
function phone(g) { blob(g, 21, 8, 3, 6, INK); blob(g, 22, 9, 1, 4, '#22c3d6'); }
function question(g) { const c = '#6d6d6a'; for (const [x, y] of [[25, 1], [26, 1], [27, 2], [27, 3], [26, 4], [26, 6]]) px(g, x, y, c); }
function sparkle(g) { const c = '#ffc21a'; for (const [x, y] of [[26, 4], [25, 5], [27, 5], [26, 5], [26, 6], [4, 8], [3, 9], [5, 9], [4, 9], [4, 10]]) px(g, x, y, c); }
const SIT = { dy: 6, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]] };
const WOOD = '#d9a066', WOOD_M = '#b9814a', WOOD_D = '#8a5a2b';
/* a desk seen from the front, with a chair back behind him; the desktop hides his thighs, his shins and shoes show beneath */
function chair(g) {
  blob(g, 7, 16, 18, 15, WOOD_M); blob(g, 7, 16, 18, 1, WOOD); outline(g, 7, 16, 18, 15);
  for (const x of [7, 24]) { blob(g, x, 32, 2, 15, WOOD_D); px(g, x - 1, 40, INK); }
  for (const x of [7, 24]) for (let y = 32; y <= 47; y++) { px(g, x - 1, y, INK); px(g, x + 2, y, INK); }
}
function desk(g) {
  blob(g, 0, 29, 32, 2, WOOD); blob(g, 0, 31, 32, 4, WOOD_M); blob(g, 0, 35, 32, 1, WOOD_D);
  for (let x = 0; x < 32; x++) { px(g, x, 28, INK); px(g, x, 36, INK); }
  for (const x of [1, 28]) { blob(g, x, 37, 3, 10, WOOD_D); for (let y = 37; y <= 47; y++) { px(g, x - 1, y, INK); px(g, x + 3, y, INK); } blob(g, x - 1, 47, 5, 1, INK); }
}
function teacup(g, x, y) {
  blob(g, x, y + 1, 5, 5, '#f4f2ec'); blob(g, x, y + 2, 5, 1, '#e0122d'); blob(g, x + 1, y, 3, 1, '#a0541f'); outline(g, x, y + 1, 5, 5);
  blob(g, x + 6, y + 2, 1, 2, INK); px(g, x + 5, y + 2, INK); px(g, x + 5, y + 4, INK);
}
function coffeecup(g, x, y) {
  blob(g, x, y + 1, 5, 6, '#f4f2ec'); blob(g, x, y + 3, 5, 2, '#a0541f'); blob(g, x - 1, y, 7, 1, '#3a3a3f'); outline(g, x - 1, y, 7, 7);
  blob(g, x + 1, y + 1, 3, 1, '#2b1a10');
}
function glass(g, x, y) { blob(g, x, y, 5, 7, '#d6f1fb'); blob(g, x + 1, y + 2, 3, 5, '#5ec3e8'); blob(g, x + 1, y + 1, 3, 1, '#ffffff'); outline(g, x, y, 5, 7); }
function hotchoc(g, x, y) { blob(g, x, y + 2, 5, 5, '#f7e3c2'); blob(g, x, y + 3, 5, 1, '#e0542f'); blob(g, x + 1, y + 1, 3, 1, '#5a3420'); blob(g, x, y, 2, 1, '#ffffff'); blob(g, x + 2, y - 1, 2, 1, '#ffffff'); px(g, x + 4, y, '#ffffff'); outline(g, x, y + 1, 5, 6); blob(g, x + 6, y + 3, 1, 2, INK); px(g, x + 5, y + 3, INK); px(g, x + 5, y + 5, INK); }
function cookie(g, x, y, bite) { const C = '#c98a48'; blob(g, x, y, 6, 6, C); blob(g, x + 1, y - 1, 4, 1, C); blob(g, x + 1, y + 6, 4, 1, C); for (const [a, b] of [[1, 1], [3, 2], [2, 4], [4, 4]]) px(g, x + a, y + b, '#4a2a14'); outline(g, x, y, 6, 6); if (bite) { for (const [a, b] of [[4, 0], [5, 0], [5, 1]]) px(g, x + a, y + b, null); } }
function plate(g) { blob(g, 5, 26, 12, 2, '#f4f2ec'); outline(g, 5, 26, 12, 2); cookie(g, 7, 22, 0); cookie(g, 12, 23, 0); }
function pizza(g, x, y) { const P = '#ffd45a'; for (let r = 0; r < 7; r++) blob(g, x + Math.floor(r / 2), y + r, 9 - r, 1, r < 6 ? P : '#c98a48'); for (const [a, b] of [[3, 1], [5, 2], [4, 3], [2, 1]]) px(g, x + a, y + b, '#d32f2f'); for (let r = 0; r < 7; r++) { px(g, x + Math.floor(r / 2) - 1, y + r, INK); px(g, x + Math.floor(r / 2) + 9 - r, y + r, INK); } for (let i = 0; i <= 9; i++) px(g, x + i, y - 1, INK); }
function steam(g, x, y) { px(g, x, y, '#dfe3e6'); px(g, x + 1, y - 1, '#c9cfd4'); px(g, x, y - 2, '#dfe3e6'); px(g, x + 1, y - 3, '#c9cfd4'); }
function teapot(g) { blob(g, 3, 23, 6, 5, '#f4f2ec'); blob(g, 3, 25, 6, 1, '#e0122d'); blob(g, 4, 22, 4, 1, '#f4f2ec'); outline(g, 3, 23, 6, 5); px(g, 5, 21, INK); px(g, 6, 21, INK); px(g, 2, 25, INK); px(g, 1, 24, INK); px(g, 9, 24, INK); px(g, 10, 25, INK); px(g, 10, 26, INK); }
function openbook(g, x, y, n) {
  blob(g, x, y + 2, 14, 5, '#e0122d'); blob(g, x + 1, y, 6, 6, '#f4f2ec'); blob(g, x + 7, y + (n ? 0 : 1), 6, n ? 6 : 5, '#f4f2ec'); blob(g, x + 6, y, 2, 6, '#c9c4b8');
  for (const j of [1, 3]) { blob(g, x + 2, y + j, 3, 1, '#b9bcc2'); blob(g, x + 8, y + j + (n ? 0 : 1), 3, 1, '#b9bcc2'); }
  for (let i = -1; i <= 14; i++) px(g, x + i, y + 7, INK); for (let i = 1; i <= 13; i++) px(g, x + i, y - 1, INK);
}
function lamp(g) { blob(g, 25, 27, 5, 1, '#3a3a3f'); for (let y = 20; y <= 27; y++) px(g, 27, y, '#3a3a3f'); blob(g, 24, 17, 7, 3, '#ffc21a'); outline(g, 24, 17, 7, 3); blob(g, 25, 20, 5, 1, '#fff3b0'); }
function beanbag(g) {
  const rows = [[7, 25], [4, 28], [3, 29], [2, 30], [2, 30], [2, 30], [2, 30], [2, 30], [2, 30], [2, 30], [2, 30], [2, 30], [2, 30], [2, 30], [3, 29]];
  rows.forEach(([a, b], i) => { const y = 33 + i; for (let x = a; x <= b; x++) px(g, x, y, '#e0542f'); px(g, a - 1, y, INK); px(g, b + 1, y, INK); });
  for (let x = 7; x <= 25; x++) px(g, x, 32, INK); for (let x = 3; x <= 29; x++) px(g, x, 48 - 1, INK);
  for (const [x, y] of [[6, 35], [7, 35], [8, 36], [24, 41], [25, 41], [23, 42], [10, 44], [11, 44]]) px(g, x, y, '#ff8a64');
  for (const [x, y] of [[16, 38], [16, 39], [17, 40], [14, 44], [15, 44], [20, 36], [21, 36]]) px(g, x, y, '#b8401f');
}
function mask(g, dy) { blob(g, 11, 8 + dy, 10, 3, '#3a3a8f'); for (let x = 11; x <= 20; x++) px(g, x, 8 + dy, '#5a5ac0'); px(g, 10, 9 + dy, '#3a3a8f'); px(g, 21, 9 + dy, '#3a3a8f'); for (let x = 11; x <= 20; x++) px(g, x, 11 + dy, INK); px(g, 10, 8 + dy, INK); px(g, 21, 8 + dy, INK); px(g, 12, 9 + dy, '#f4f2ec'); px(g, 19, 9 + dy, '#f4f2ec'); }
function heartEyes(g, dy) { const R = '#e0122d', cells = [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [1, 2]]; for (const ex of [12, 17]) { for (const x of [13 + (ex - 12) * 0, 18]) for (const y of [8, 9]) { /* wipe the old eye */ } for (const [cx, cy] of cells) px(g, ex + cx, 8 + dy + cy, R); } }
const TOP = base.findIndex(r => r.some(Boolean));
function ears(g, dy) {
  const e0 = Math.max(0, TOP + dy - 2), P = '#e88aa0', L = [[[9], [INK]], [[9, 10], [INK, INK]], [[9, 10, 11], [INK, P, INK]], [[9, 10, 11, 12], [INK, P, P, INK]]];
  L.forEach(([xs, cs], r) => xs.forEach((x, i) => { px(g, x, e0 + r, cs[i]); px(g, 31 - x, e0 + r, cs[i]); }));
}
function tail(g) { const mask = new Set(); stampPath(mask, [[27, 38], [29, 36], [30, 33], [29, 30]], 1.2); layer(g, mask, HAIR); }
const HANG = [[7, 28], [25, 28]];
const FRAMES = {
  idle: {}, idle2: { blink: true }, walk: { f: [[10, 46], [22, 45]] },
  walk1: { f: [[11, 46], [22, 42]], h: [[6, 29], [26, 27]] }, walk2: { f: [[10, 42], [21, 46]], h: [[6, 27], [26, 29]] },
  wave1: { h: [[5.5, 28], [27, 11]] }, wave2: { h: [[5.5, 28], [29, 14]] },
  point: { h: [[1, 15], [26.5, 28]] },
  headphones: { hp: true, h: [[7, 28], [23, 13]] },
  guard: { glove: true, el: [[8, 24], [24, 24]], h: [[9, 18], [23, 18]] },
  guitar1: { f: [[11, 46], [21, 46]], h: [[12, 27], [30, 19]] }, guitar2: { f: [[11, 46], [21, 46]], h: [[12, 30], [30, 19]] },
  dL: { dy: 6, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]], h: [[11, 33], [27, 21]], stick: [3, 4] },
  dR: { dy: 6, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]], h: [[5, 21], [21, 33]], stick: [4, 3] },
  dK: { dy: 6, hy: 34, f: [[10, 46], [22, 43]], k: [[10, 40], [22, 39]], h: [[4, 24], [28, 24]], stick: [4, 4] },
  dance1: { f: [[11, 46], [21, 44]], h: [[3, 12], [27, 27]] }, dance2: { f: [[11, 46], [21, 46]], h: [[3, 20], [29, 20]] },
  dance3: { f: [[11, 44], [21, 46]], h: [[5, 27], [29, 12]] },
  six1: { dy: 12, hy: 40, f: [[4, 46], [27, 46]], k: [[7, 43], [25, 43]], h: [[7, 45], [24, 38]] }, six2: { dy: 12, hy: 40, f: [[26, 46], [6, 46]], k: [[24, 43], [8, 43]], h: [[8, 38], [25, 45]] },
  hand1: { flip: true, al: 10, f: [[7, 46], [25, 46]], h: [[9, 0], [23, 0]] }, hand2: { flip: true, al: 10, f: [[12, 46], [20, 46]], h: [[9, 0], [23, 0]] },
  step1: { f: [[6, 46], [24, 46]], bx: -1, h: [[3, 26], [29, 20]] }, step2: { f: [[8, 46], [26, 46]], bx: 1, h: [[3, 20], [29, 26]] },
  cross1: { top: 1, f: [[19, 46], [12, 46]], bx: 1, h: [[3, 22], [29, 27]] }, cross2: { top: 0, f: [[19, 46], [12, 46]], bx: -1, h: [[3, 27], [29, 22]] },
  head1: { flip: true, f: [[12, 46], [20, 46]], h: [[7, 28], [25, 28]] }, head2: { flip: true, f: [[5, 46], [27, 46]], h: [[3, 26], [29, 26]] },
  pop1: { f: [[11, 46], [21, 46]], h: [[3, 13], [28, 25]] }, pop2: { f: [[11, 46], [21, 46]], h: [[3, 25], [28, 13]] },
  moon1: { bx: -1, f: [[9, 46], [21, 44]], h: [[6, 27], [25, 25]] }, moon2: { bx: 1, f: [[11, 44], [23, 46]], h: [[6, 25], [25, 27]] },
  floss1: { bx: -1, f: [[8, 46], [20, 46]], h: [[26, 27], [30, 23]] }, floss2: { bx: 1, f: [[12, 46], [24, 46]], h: [[2, 23], [6, 27]] },
  dab: { f: [[10, 46], [22, 46]], h: [[17, 11], [30, 5]] },
  kick: { ll: 9.6, f: [[10, 46], [30, 22]], h: [[2, 21], [27, 26]] },
  jump: { f: [[11, 41], [21, 41]], h: [[2, 11], [30, 11]] },
  laptop: { lap: true, dy: 6, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]], h: [[10, 36], [22, 36]] },
  tea1: { ...SIT, desk: 1, pot: 1, item: ['tea', 19, 23], h: [[11, 28], [18, 28]] },
  tea2: { ...SIT, desk: 1, pot: 1, item: ['tea', 14, 17], h: [[12, 24], [20, 24]], el: [[8, 28], [25, 28]] },
  sip: { ...SIT, desk: 1, pot: 1, item: ['tea', 14, 17], eyes: 1, h: [[12, 24], [20, 24]], el: [[8, 28], [25, 28]] },
  read1: { ...SIT, desk: 1, lamp: 1, item: ['book', 9, 24, 0], h: [[8, 28], [23, 28]] },
  read2: { ...SIT, desk: 1, lamp: 1, item: ['book', 9, 24, 1], eyes: 1, h: [[8, 28], [22, 22]], el: [null, [26, 24]] },
  sleep1: { ...SIT, bag: 1, mask: 1, h: [[12, 31], [20, 31]], el: [[8, 29], [24, 29]], zzz: 0 },
  sleep2: { ...SIT, bag: 1, mask: 1, h: [[12, 31], [20, 31]], el: [[8, 29], [24, 29]], zzz: 1 },
  laptop2: { lap: true, dy: 5, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]], h: [[10, 36], [22, 36]] },
  idea: { bulb: 1, h: [[7, 28], [24, 12]] },
  sweat: { sweat: 1, h: [[7, 28], [25, 28]] },
  love: { heart: 1, hearteyes: 1, h: [[7, 28], [25, 28]] },
  focus: { hp: true, eyes: 1, h: [[7, 28], [25, 28]] },
  cookie1: { ...SIT, desk: 1, plate: 1, h: [[11, 28], [20, 28]] },
  cookie2: { ...SIT, desk: 1, plate: 1, item: ['cookie', 13, 18, 0], h: [[11, 28], [16, 22]], el: [null, [24, 27]] },
  cookie3: { ...SIT, desk: 1, plate: 1, item: ['cookie', 13, 18, 1], eyes: 1, h: [[11, 28], [16, 22]], el: [null, [24, 27]] },
  water1: { ...SIT, desk: 1, item: ['water', 19, 22], h: [[9, 28], [18, 28]] },
  water2: { ...SIT, desk: 1, item: ['water', 14, 16], h: [[12, 24], [20, 24]], el: [[8, 28], [25, 28]] },
  water3: { ...SIT, desk: 1, item: ['water', 14, 16], eyes: 1, h: [[12, 24], [20, 24]], el: [[8, 28], [25, 28]] },
  hot1: { ...SIT, desk: 1, item: ['hot', 19, 22], h: [[9, 28], [18, 28]] },
  hot2: { ...SIT, desk: 1, item: ['hot', 14, 16], h: [[12, 24], [20, 24]], el: [[8, 28], [25, 28]] },
  hot3: { ...SIT, desk: 1, item: ['hot', 14, 16], eyes: 1, h: [[12, 24], [20, 24]], el: [[8, 28], [25, 28]] },
  pizza1: { ...SIT, desk: 1, item: ['pizza', 12, 21], h: [[10, 28], [20, 28]] },
  pizza2: { ...SIT, desk: 1, item: ['pizza', 12, 15], eyes: 1, h: [[11, 25], [19, 25]], el: [[8, 28], [25, 28]] },
  coffee1: { ...SIT, desk: 1, item: ['coffee', 19, 22], h: [[9, 28], [18, 28]] },
  coffee2: { ...SIT, desk: 1, item: ['coffee', 14, 16], h: [[12, 24], [20, 24]], el: [[8, 28], [25, 28]] },
  coffee3: { ...SIT, desk: 1, item: ['coffee', 14, 16], eyes: 1, h: [[12, 24], [20, 24]], el: [[8, 28], [25, 28]] },
  wink: { wink: 1, heart: 1, h: [[7, 28], [25, 28]] },
  kiss: { heart: 1, eyes: 1, h: [[7, 28], [20, 12]], el: [null, [25, 19]] },
  rose: { rose: 1, wink: 1, h: [[7, 28], [24, 22]], el: [null, [26, 25]] },
  flirt: { wink: 1, h: [[7, 28], [24, 29]], bx: 0, f: [[10, 46], [22, 46]] },
  hang1: { f: [[12, 44], [20, 44]], h: [[10, 0], [22, 0]], el: [[10, 12], [22, 12]] },
  hang2: { f: [[13, 45], [19, 43]], h: [[10, 0], [22, 0]], el: [[10, 12], [22, 12]] },
  climb1: { f: [[11, 42], [21, 46]], k: [[8, 38], [23, 40]], h: [[8, 1], [24, 15]], el: [[7, 12], [27, 22]] },
  climb2: { f: [[11, 46], [21, 42]], k: [[9, 40], [24, 38]], h: [[8, 15], [24, 1]], el: [[5, 22], [25, 12]] },
  crouch: { dy: 4, hy: 32, f: [[5, 46], [27, 46]], k: [[7, 38], [25, 38]], h: [[2, 44], [30, 44]], el: [[2, 34], [30, 34]] },
  thwip: { web: 1, h: [[7, 30], [25, 18]], el: [null, [24, 24]], f: [[8, 46], [24, 46]] },
  shrug: { sweat: 1, h: [[4, 22], [28, 22]], el: [[6, 26], [26, 26]] },
  facepalm: { eyes: 1, h: [[7, 28], [16, 9]], el: [null, [24, 20]] },
  clap: { h: [[14, 22], [18, 22]], el: [[8, 26], [24, 26]] },
  salute: { h: [[7, 28], [21, 6]], el: [null, [26, 14]] },
  flex: { h: [[8, 11], [24, 11]], el: [[3, 21], [29, 21]], spark: 1 },
  yawn: { eyes: 1, h: [[7, 28], [19, 13]], el: [null, [25, 21]] },
  think: { q: 1, h: [[7, 28], [18, 15]], el: [null, [25, 22]] },
  phone: { phone: 1, h: [[7, 28], [22, 13]], el: [null, [26, 20]] },
  cool: { shades: 1, spark: 1, h: [[7, 28], [25, 28]] },
  sit: { dy: 6, hy: 34, f: [[10, 46], [22, 46]], k: [[10, 40], [22, 40]], h: [[10, 34], [22, 34]] }
};
for (const [name, p] of Object.entries(FRAMES)) { if (!p.h) p.h = HANG; else p.h = p.h.map((q, i) => q[0] === 5.5 && q[1] === 28 || q[0] === 26.5 && q[1] === 28 ? HANG[i] : q); }

const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function encode(g) {
  const raw = Buffer.alloc(H * (W * 4 + 1)); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = g[y][x], i = y * (W * 4 + 1) + 1 + x * 4; if (c) { raw[i] = parseInt(c.slice(1, 3), 16); raw[i + 1] = parseInt(c.slice(3, 5), 16); raw[i + 2] = parseInt(c.slice(5, 7), 16); raw[i + 3] = 255; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const [name, p] of Object.entries(FRAMES)) { fs.writeFileSync(new URL(`durva-${name}.png`, DIR), encode(make(p))); fs.writeFileSync(new URL(`durva-${name}-cat.png`, DIR), encode(make(p, true))); }
console.log('wrote', Object.keys(FRAMES).length, 'frames x2');
