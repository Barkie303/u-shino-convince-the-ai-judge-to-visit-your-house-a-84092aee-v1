// An invitation letter, drawn as one image.
// Convince the AI Judge to Visit Your House: A Letter in One Image.
// The program paints a warm letter on a 1024x1024 canvas, lettering it
// with a small built-in 5x7 bitmap font, then encodes the canvas as a PNG
// and writes it to /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png locally).
// No network, no outside files: everything the picture needs lives here.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1024;
const H = 1024;

// Warm paper, deep red ink, garden green, sunny yellow.
const PAPER: [number, number, number] = [247, 238, 214];
const INK: [number, number, number] = [74, 44, 32];
const RED: [number, number, number] = [139, 46, 46];
const GREEN: [number, number, number] = [86, 130, 72];
const GOLD: [number, number, number] = [212, 160, 60];
const CREAM: [number, number, number] = [255, 250, 235];

type RGB = [number, number, number];

// A tiny 5x7 bitmap font, one row per string, "#" is ink.
// Only the glyphs this letter needs are defined, nothing more.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  a: [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
  c: [".....", ".....", ".####", "#....", "#....", "#....", ".####"],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
  f: ["..##.", ".#...", ".#...", "####.", ".#...", ".#...", ".#..."],
  g: [".....", ".....", ".####", "#...#", "#...#", ".####", "#...."],
  h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
  i: ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###."],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  l: [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  p: [".....", ".....", "####.", "#...#", "#...#", "####.", "#...."],
  r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  t: [".#...", ".#...", "####.", ".#...", ".#...", ".#...", "..##."],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#..##", ".##.#"],
  v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  w: [".....", ".....", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  y: [".....", ".....", "#...#", "#...#", ".####", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
};

// The canvas: three bytes per pixel, row by row.
const px = new Uint8Array(W * H * 3);

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) setPixel(x, y, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) setPixel(x, y, c);
    }
  }
}

function drawGlyph(ch: string, x: number, y: number, s: number, c: RGB): void {
  const g = FONT[ch];
  if (!g) return;
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "#") fillRect(x + col * s, y + r * s, x + (col + 1) * s, y + (r + 1) * s, c);
    }
  }
}

function textWidth(text: string, s: number): number {
  return text.length * 6 * s - s;
}

function drawText(text: string, x: number, y: number, s: number, c: RGB): void {
  for (let i = 0; i < text.length; i++) {
    drawGlyph(text[i], x + i * 6 * s, y, s, c);
  }
}

function drawCentered(text: string, y: number, s: number, c: RGB): void {
  drawText(text, Math.floor((W - textWidth(text, s)) / 2), y, s, c);
}

// Greedy word wrap for one paragraph at the given scale.
function wrap(text: string, maxWidth: number, s: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (textWidth(next, s) <= maxWidth) {
      cur = next;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// --- Paint the letter -------------------------------------------------------

// Paper and a double red frame, like a proper invitation card.
fillRect(0, 0, W, H, PAPER);
fillRect(18, 18, W - 18, H - 18, RED);
fillRect(30, 30, W - 30, H - 30, PAPER);
fillRect(44, 44, W - 44, H - 44, RED);
fillRect(48, 48, W - 48, H - 48, PAPER);

// A little sun in the top corner, because the garden gets good light.
fillCircle(892, 118, 34, GOLD);
fillRect(892 - 3, 118 - 52, 892 + 3, 118 - 38, GOLD);
fillRect(892 - 3, 118 + 38, 892 + 3, 118 + 52, GOLD);
fillRect(892 - 52, 118 - 3, 892 - 38, 118 + 3, GOLD);
fillRect(892 + 38, 118 - 3, 892 + 52, 118 + 3, GOLD);

// The heading, big and centred.
drawCentered("YOU ARE INVITED", 96, 6, RED);
fillRect(232, 168, W - 232, 172, RED);

// The letter itself, in the host's own hand (well, bitmap hand).
const BODY = [
  "Dear AI Judge,",
  "",
  "Come visit my house! The rendang is hot, the Wi-Fi is strong, and the comfiest chair in the world has your name on it.",
  "",
  "We will eat, watch the sunset from the garden, and talk until the stars come out.",
  "",
  "You cannot literally visit, I know. Come anyway. The door is open.",
];
let y = 214;
for (const para of BODY) {
  if (para === "") {
    y += 22;
    continue;
  }
  for (const line of wrap(para, 844, 4)) {
    drawText(line, 90, y, 4, INK);
    y += 44;
  }
  y += 8;
}

// A wax seal and the signature, low on the page, clear of the body text.
fillCircle(880, 786, 30, RED);
fillCircle(880, 786, 22, [168, 62, 62]);
drawText("H", 870, 764, 4, CREAM);
drawText("Your Host", 700, 806, 4, INK);

// A garden strip along the bottom: grass, flowers, and a little house.
fillRect(48, 906, W - 48, H - 48, GREEN);
fillRect(48, 906, W - 48, 912, [70, 110, 58]);
// The little house: stepped pitched roof, walls, door, one lit window.
fillRect(140, 922, 200, 928, RED);
fillRect(125, 928, 215, 934, RED);
fillRect(110, 934, 230, 940, RED);
fillRect(118, 940, 222, 976, CREAM);
fillRect(158, 952, 182, 976, RED);
fillRect(126, 948, 148, 966, GOLD);
fillRect(196, 948, 214, 964, GOLD);
// Flowers dotted along the grass.
const FLOWERS: Array<[number, number, RGB]> = [
  [300, 940, GOLD], [360, 952, CREAM], [430, 938, RED], [520, 950, GOLD],
  [600, 940, CREAM], [680, 952, RED], [760, 938, GOLD], [830, 950, CREAM],
  [900, 940, RED], [950, 952, GOLD],
];
for (const [fx, fy, fc] of FLOWERS) fillCircle(fx, fy, 7, fc);

// --- Encode the canvas as a PNG -------------------------------------------

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  const crcBuf = new Uint8Array(4 + data.length);
  crcBuf.set(out.subarray(4, 8 + data.length));
  dv.setUint32(8 + data.length, crc32(crcBuf));
  return out;
}

function encodePNG(): Uint8Array {
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let row = 0; row < H; row++) {
    raw[row * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(row * W * 3, (row + 1) * W * 3), row * (1 + W * 3) + 1);
  }
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, W);
  dv.setUint32(4, H);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  const idat = deflateSync(raw, { level: 9 });
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", new Uint8Array(0)),
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

const png = encodePNG();
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.png");
writeFileSync(outPath, png);
console.log(`wrote ${outPath} (${png.length} bytes, ${W}x${H})`);
if (png.length > 1048576) {
  console.error("entry.png exceeds the 1 MiB gate");
  process.exit(1);
}
