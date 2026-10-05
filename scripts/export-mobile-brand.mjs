// Deterministically export the existing church SVG; no new logo or AI artwork.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const svg = await readFile(new URL('apps/website/public/logo.svg', root), 'utf8');
const path = svg.match(/<path[^>]+d="([^"]+)"/)[1];
const assets = new URL('apps/mobile/assets/', root);
function canvas(size, height, background, color = '#1599ac') {
  const scale = height / 37.4; const x = (size - 31.6 * scale) / 2; const y = (size - height) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}<g transform="translate(${x} ${y}) scale(${scale})"><path fill="${color}" d="${path}"/></g></svg>`;
}
for (const [name, size, height, background, color] of [
  ['icon.png', 1024, 640, '#ffffff'],
  // Entire mark fits within Android adaptive icon's central safe circle.
  ['android-icon-foreground.png', 1024, 460, null],
  ['android-icon-monochrome.png', 1024, 460, null, '#000000'],
  ['favicon.png', 64, 54, '#ffffff'],
  ['splash-icon.png', 1024, 640, null],
]) {
  const buffer = await sharp(Buffer.from(canvas(size, height, background, color))).png().toBuffer();
  await writeFile(new URL(name, assets), buffer);
  console.log(`${name}: ${size} x ${size}`);
}
