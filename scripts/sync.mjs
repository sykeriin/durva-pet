// Copies the shared engine + sprites into extension/ and desktop/, and builds square icons from the idle sprite.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sprites = path.join(root, 'assets/sprites');
const targets = ['extension', 'desktop/app'];

const map = {};
for (const f of fs.readdirSync(sprites)) {
  const m = f.match(/^durva-(.+)\.png$/);
  if (m) map[m[1]] = 'data:image/png;base64,' + fs.readFileSync(path.join(sprites, f)).toString('base64');
}
const spritesJs = 'window.DURVA_SPRITES=' + JSON.stringify(map) + ';\n';
for (const t of targets) {
  const dir = path.join(root, t);
  fs.rmSync(path.join(dir, 'sprites'), { recursive: true, force: true });
  fs.copyFileSync(path.join(root, 'core/pet.js'), path.join(dir, 'pet.js'));
  fs.writeFileSync(path.join(dir, 'sprites.js'), spritesJs);
}

// --- tiny PNG decode / encode (RGBA 8-bit) ---
function decode(buf) {
  let p = 8, w, h, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[9] !== 6) throw new Error('need RGBA8'); }
    if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * 4, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[y * stride + i - bpp] : 0, b = y ? out[(y - 1) * stride + i] : 0, c = i >= bpp && y ? out[(y - 1) * stride + i - bpp] : 0;
      let v = row[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + i] = v & 255;
    }
  }
  return { w, h, px: out };
}
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) { const t = Buffer.from(type), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]); }
function encode(w, h, px) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Icon: the head and shoulders (top 24 rows) of the idle sprite on a square, scaled with nearest neighbour.
const src = decode(fs.readFileSync(path.join(sprites, 'durva-idle.png')));
const crop = { x: 0, y: 0, w: 32, h: 32 };
function icon(size) {
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sx = crop.x + Math.floor(x * crop.w / size), sy = crop.y + Math.floor(y * crop.h / size), s = (sy * src.w + sx) * 4, d = (y * size + x) * 4;
    src.px.copy(px, d, s, s + 4);
  }
  return encode(size, size, px);
}
for (const [dir, sizes] of [['extension/icons', [16, 48, 128]], ['desktop/app', [256]]]) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const s of sizes) fs.writeFileSync(path.join(root, dir, (dir.startsWith('desktop') ? 'icon' : s) + '.png'), icon(s));
}
console.log('synced');
