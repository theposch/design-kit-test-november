import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * Read off disk for the same reason as utils.test.ts: the Tailwind Vite plugin
 * would compile the `.css` and strip the source this test parses.
 */
const paletteCss = readFileSync(
  new URL('./palette.css', import.meta.url),
  'utf8',
);

type Oklch = { l: number; c: number; h: number; alpha: number };

const OKLCH =
  /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/;

/*
 * Every declaration in the block must be a plain `oklch()`: anything else
 * (hex, `var()`, `color-mix()`) lands in `unreadable`, and a test fails, so
 * no token can slip past the checks below by being written differently.
 */
function parseBlock(selector: RegExp) {
  const block = selector.exec(paletteCss)?.[1];
  if (!block) throw new Error(`palette.css: no block matching ${selector}`);
  const tokens = new Map<string, Oklch>();
  const unreadable: string[] = [];
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    const match = OKLCH.exec(value.trim());
    if (!match) {
      unreadable.push(`--${name}: ${value.trim()}`);
      continue;
    }
    const [, l, c, h, alpha, percent] = match;
    tokens.set(name, {
      l: Number(l),
      c: Number(c),
      h: Number(h),
      alpha:
        alpha === undefined ? 1 : Number(alpha) / (percent === '%' ? 100 : 1),
    });
  }
  return { tokens, unreadable };
}

const modes = {
  light: parseBlock(/:root\s*\{([^}]*)\}/),
  dark: parseBlock(/\n\.dark\s*\{([^}]*)\}/),
};

/* OKLCH → linear sRGB (Björn Ottosson's reference matrices), clamped to gamut. */
function linearRgb({ l, c, h }: Oklch): number[] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const [L, M, S] = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((v) => v ** 3);
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ].map((v) => Math.min(1, Math.max(0, v)));
}

const encode = (v: number) =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
const decode = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

/*
 * A see-through colour is measured as it renders: blended over what sits
 * behind it, in gamma-encoded sRGB the way browsers composite.
 */
function rendered(fg: Oklch, bg: Oklch): number[] {
  const back = linearRgb(bg).map(encode);
  return linearRgb(fg)
    .map(encode)
    .map((v, i) => decode(v * fg.alpha + back[i] * (1 - fg.alpha)));
}

const luminance = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function contrast(fg: Oklch, bg: Oklch): number {
  const [hi, lo] = [luminance(rendered(fg, bg)), luminance(linearRgb(bg))].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

/* [text-or-mark token, background token, minimum ratio] */
const pairs: [string, string, number][] = [
  ['foreground', 'background', 4.5],
  ['surface-foreground', 'surface', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['secondary-foreground', 'secondary', 4.5],
  ['destructive-foreground', 'destructive', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['muted-foreground', 'surface', 4.5],
  ['muted-foreground', 'muted', 4.5],
  ['foreground', 'muted', 4.5],
  ['destructive', 'background', 4.5],
  ['destructive', 'surface', 4.5],
  ['success-subtle-foreground', 'success-subtle', 4.5],
  ['success-subtle-foreground', 'background', 3],
  ['success-subtle-foreground', 'surface', 3],
  ['warning-subtle-foreground', 'warning-subtle', 4.5],
  ['warning-subtle-foreground', 'background', 3],
  ['warning-subtle-foreground', 'surface', 3],
  ['info-subtle-foreground', 'info-subtle', 4.5],
  ['info-subtle-foreground', 'background', 3],
  ['info-subtle-foreground', 'surface', 3],
  ['destructive-subtle-foreground', 'destructive-subtle', 4.5],
  ['destructive-subtle-foreground', 'background', 3],
  ['destructive-subtle-foreground', 'surface', 3],
  ['input', 'background', 3],
  ['input', 'surface', 3],
  ['primary', 'background', 3],
  ['primary', 'surface', 3],
  ['ring', 'background', 3],
  ['ring', 'surface', 3],
];

describe('palette.css', () => {
  it('writes every token as a plain oklch()', () => {
    expect([...modes.light.unreadable, ...modes.dark.unreadable]).toEqual([]);
  });

  it('gives every light token a dark override', () => {
    const missing = [...modes.light.tokens.keys()].filter(
      (name) => !modes.dark.tokens.has(name),
    );
    expect(missing).toEqual([]);
  });

  it('blends see-through colours before measuring', () => {
    const white = { l: 1, c: 0, h: 0, alpha: 1 };
    const clearBlack = { l: 0, c: 0, h: 0, alpha: 0 };
    expect(contrast(clearBlack, white)).toBeCloseTo(1);
  });

  describe.each(Object.entries(modes))('%s mode', (_mode, { tokens }) => {
    it.each(pairs)('%s on %s clears %s:1', (fg, bg, min) => {
      const fgToken = tokens.get(fg);
      const bgToken = tokens.get(bg);
      expect(fgToken, `--${fg} is missing`).toBeDefined();
      expect(bgToken, `--${bg} is missing`).toBeDefined();
      expect(contrast(fgToken!, bgToken!)).toBeGreaterThanOrEqual(min);
    });
  });
});
