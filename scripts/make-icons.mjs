// Uygulama ikonlarını ek bağımlılık olmadan üretir: şekiller işaretli mesafe
// fonksiyonlarıyla (SDF) çizilir, 4×4 süper örneklemeyle yumuşatılır ve Node'un zlib'i
// ile PNG'ye yazılır. Çıktı public/ altına gider ve depoya eklenir.
//   node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public/', import.meta.url));

const ACCENT = [0x3d, 0x4e, 0xd8];
const WHITE = [0xff, 0xff, 0xff];

/** Yuvarlatılmış dikdörtgen SDF'i (merkez cx,cy; yarı boyut hw,hh; köşe r). */
function roundRect(x, y, cx, cy, hw, hh, r) {
  const qx = Math.abs(x - cx) - hw + r;
  const qy = Math.abs(y - cy) - hh + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

function circle(x, y, cx, cy, r) {
  return Math.hypot(x - cx, y - cy) - r;
}

/**
 * Cüzdan: beyaz gövde, sağda vurgu renginde sekme, sekmede beyaz düğme.
 * Koordinatlar 0–1 aralığında; scale içerik boyutunu (maskelenebilir ikon için) küçültür.
 */
function colorAt(u, v, scale) {
  const x = (u - 0.5) / scale + 0.5;
  const y = (v - 0.5) / scale + 0.5;
  if (circle(x, y, 0.655, 0.53, 0.035) <= 0) return WHITE;
  if (roundRect(x, y, 0.655, 0.53, 0.115, 0.075, 0.06) <= 0) return ACCENT;
  if (roundRect(x, y, 0.5, 0.53, 0.25, 0.19, 0.06) <= 0) return WHITE;
  // Gövdenin üstündeki kapak çizgisi
  if (roundRect(x, y, 0.47, 0.305, 0.19, 0.022, 0.022) <= 0) return WHITE;
  return ACCENT;
}

function render(size, scale) {
  const S = 4;
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const c = colorAt((px + (sx + 0.5) / S) / size, (py + (sy + 0.5) / S) / size, scale);
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const i = (py * size + px) * 4;
      rgba[i] = Math.round(r / (S * S));
      rgba[i + 1] = Math.round(g / (S * S));
      rgba[i + 2] = Math.round(b / (S * S));
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit derinliği
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filtre yok
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ICONS = [
  ['pwa-192x192.png', 192, 1],
  ['pwa-512x512.png', 512, 1],
  // Maskelenebilir: içerik %80'lik güvenli dairenin içinde kalsın diye küçültülür.
  ['maskable-512x512.png', 512, 0.78],
  ['apple-touch-icon.png', 180, 0.9],
];

for (const [name, size, scale] of ICONS) {
  writeFileSync(OUT + name, png(size, render(size, scale)));
  console.log('yazıldı', name);
}
