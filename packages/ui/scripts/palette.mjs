#!/usr/bin/env node
/*
 * pnpm palette:convert '#1a1f2e' 'rgba(255,255,255,0.2)' …
 *
 * Turns hex and rgb colours (what Figma and most tools give) into the oklch()
 * that palette.css is written in. See-through colours keep their alpha as a
 * percentage: oklch(1 0 0 / 20%). Each one also names the nearest colour
 * already in palette.css, so a near-duplicate becomes the existing token.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const round = (value, places) => {
  const n = Number(value.toFixed(places));
  return Object.is(n, -0) ? 0 : n;
};

export function parseColour(input) {
  const text = input.trim().toLowerCase();
  const hex = /^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.exec(text);
  if (hex) {
    let digits = hex[1];
    if (digits.length <= 4) digits = [...digits].map((d) => d + d).join('');
    const [r, g, b, a = 255] = digits
      .match(/../g)
      .map((pair) => Number.parseInt(pair, 16));
    return { r: r / 255, g: g / 255, b: b / 255, alpha: a / 255 };
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(text);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (p) =>
      p.endsWith('%') ? Number.parseFloat(p) / 100 : Number.parseFloat(p) / 255;
    const alpha =
      parts[3] === undefined
        ? 1
        : parts[3].endsWith('%')
          ? Number.parseFloat(parts[3]) / 100
          : Number.parseFloat(parts[3]);
    const [r, g, b] = parts.slice(0, 3).map(channel);
    if ([r, g, b, alpha].some(Number.isNaN)) return null;
    return { r, g, b, alpha };
  }
  return null;
}

/* sRGB → OKLab, Björn Ottosson's reference matrices. */
export function toOklab({ r, g, b }) {
  const linear = (v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const [lr, lg, lb] = [r, g, b].map(linear);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, A, B];
}

export function toOklch(colour) {
  const { alpha = 1 } = colour;
  const [L, A, B] = toOklab(colour);
  const C = Math.sqrt(A * A + B * B);
  /* A grey has no hue; writing 0 keeps the palette diff quiet. */
  const H = C < 0.0005 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  const body = `${round(L, 3)} ${C < 0.0005 ? 0 : round(C, 3)} ${round(H, 1)}`;
  return alpha < 1
    ? `oklch(${body} / ${round(alpha * 100, 1)}%)`
    : `oklch(${body})`;
}

/* Every `--name: oklch(…)` in palette.css, light (:root) and dark (.dark), as OKLab. */
export function paletteColours(css) {
  const out = [];
  let mode = 'light';
  for (const line of css.split('\n')) {
    if (/\.dark\b/.test(line)) mode = 'dark';
    const m =
      /--([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%)?\s*\)/.exec(
        line,
      );
    if (!m) continue;
    const [L, C, H] = m.slice(2, 5).map(Number);
    const rad = (H * Math.PI) / 180;
    out.push({
      name: m[1],
      mode,
      lab: [L, C * Math.cos(rad), C * Math.sin(rad)],
      alpha: m[5] === undefined ? 1 : Number(m[5]) / 100,
    });
  }
  return out;
}

/* The palette colour closest to this one, by distance in OKLab (0.02 is about a just-visible step). */
export function nearest(colour, palette) {
  const lab = toOklab(colour);
  let best = null;
  for (const p of palette) {
    if (Math.abs(p.alpha - (colour.alpha ?? 1)) > 0.02) continue;
    const d = Math.hypot(...lab.map((v, i) => v - p.lab[i]));
    if (!best || d < best.distance) best = { ...p, distance: d };
  }
  return best;
}

export function convert(input) {
  const colour = parseColour(input);
  return colour ? toOklch(colour) : null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const inputs = process.argv.slice(2);
  if (!inputs.length) {
    console.error(
      "\nUsage: pnpm palette:convert '#1a1f2e' 'rgba(255,255,255,0.2)'\n",
    );
    process.exit(1);
  }
  const file = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../src/theme/palette.css',
  );
  const palette = existsSync(file)
    ? paletteColours(readFileSync(file, 'utf8'))
    : [];
  let failed = false;
  for (const input of inputs) {
    const colour = parseColour(input);
    if (!colour) {
      failed = true;
      console.error(`  ! ${input}: not a hex or rgb colour`);
      continue;
    }
    const near = nearest(colour, palette);
    const hint = !near
      ? ''
      : near.distance < 0.02
        ? `  = --${near.name} (${near.mode}): already in the palette`
        : `  nearest --${near.name} (${near.mode}), ${near.distance.toFixed(3)} away`;
    console.log(`${input.padEnd(24)} ${toOklch(colour)}${hint}`);
  }
  process.exitCode = failed ? 1 : 0;
}
