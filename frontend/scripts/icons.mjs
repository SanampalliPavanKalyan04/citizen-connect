// Draws the app icon (shield + tick + tricolor) as PNGs for the installable app.
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const NAVY = hex("#0b2559"), SAFFRON = hex("#f28c1b"), WHITE = [255, 255, 255], GREEN = hex("#138808");
const SHIELD = [[256, 104], [136, 150], [136, 242], [150, 310], [190, 355], [256, 384], [322, 355], [362, 310], [376, 242], [376, 150]];
const TICK = [[206, 250], [242, 286], [312, 214]];

function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function segDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function color(x, y) { // x, y in 0..512 design space
  if (y < 22) return x < 171 ? SAFFRON : x < 341 ? WHITE : GREEN;
  if (segDist(x, y, TICK[0], TICK[1]) < 15 || segDist(x, y, TICK[1], TICK[2]) < 15) return WHITE;
  if (inPoly(x, y, SHIELD)) return SAFFRON;
  return NAVY;
}
function png(size) {
  const s = 512 / size, raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const c = color((x + 0.5) * s, (y + 0.5) * s), o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2];
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
mkdirSync("public", { recursive: true });
for (const size of [192, 512]) writeFileSync(`public/icon-${size}.png`, png(size));
console.log("icons written");
