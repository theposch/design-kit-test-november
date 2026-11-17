#!/usr/bin/env node
/*
 * pnpm tokens           writes packages/ui/design.tokens.json from the theme CSS
 * pnpm tokens --check   exits 1 when that file is out of date (a unit test runs this)
 *
 * The CSS in src/theme is the source: Tailwind reads it, and it is the only
 * place a token is edited. design.tokens.json is a generated copy in the shared token
 * format (DTCG 2025.10, https://www.designtokens.org/tr/2025.10/), for tools
 * that can't read our CSS: figma_import_tokens loads it into the Figma
 * library's variables, and other teams and platforms can read it as is.
 *
 * Shaped for that import:
 * - each top-level group becomes a Figma collection (Color, Typography, …);
 * - light/dark, phone sizes and reduced motion become modes. The first mode is
 *   `$value`; the others sit in $extensions["figma-console-mcp"].modes, the
 *   place the importer reads them from;
 * - colours are DTCG colour objects in oklch with a hex fallback (the importer
 *   reads the hex; other tools keep the exact oklch);
 * - sizes are px (the importer reads "1rem" as 1), with rem noted alongside;
 * - `em` values (letter spacing, the icon size) have no Figma unit, so they are
 *   plain numbers with a description saying so.
 *
 * A custom property this script can't place fails the run, so a new token
 * can't silently go missing from Figma.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
export const THEME = path.join(PACKAGE, 'src', 'theme');
export const OUTPUT = path.join(PACKAGE, 'design.tokens.json');
const REM = 16;
const MCP = 'figma-console-mcp';

/*
 * One entry per theme file that declares tokens. `modes` names the default
 * mode first, then what each override block becomes. `prefix` is dropped from
 * the CSS name; `split` turns the last hyphen into a group (`heading-1-size`
 * → `heading-1/size`), so related tokens sit together in Figma. `theme` files
 * define their scale inside `@theme`; elsewhere `@theme` only registers
 * existing tokens with Tailwind (`--color-primary: var(--primary)`) and is
 * skipped.
 */
const FILES = {
  'palette.css': {
    collection: 'Color',
    modes: { default: 'Light', dark: 'Dark' },
  },
  'typography.css': {
    collection: 'Typography',
    modes: { phone: 'Phone', default: 'Tablet and desktop' },
    split: true,
  },
  'font.css': { collection: 'Typography', split: true },
  'motion.css': {
    collection: 'Motion',
    modes: { default: 'Default', reducedMotion: 'Reduced motion' },
    prefix: 'motion-',
    split: true,
  },
  'radii.css': { collection: 'Radius', prefix: 'radius-', theme: true },
  'spacing.css': { collection: 'Spacing', prefix: 'spacing-', theme: true },
  'breakpoints.css': {
    collection: 'Breakpoint',
    prefix: 'breakpoint-',
    theme: true,
  },
};

/* -------------------------------------------------------------- CSS reading */

/*
 * Every `--name: value;` with the blocks around it (`@theme inline`, `:root`,
 * `.dark`, `@media (…)`, `@utility …`). Comments go first, so a commented-out
 * example can't become a token.
 */
export function declarations(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const stack = [];
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') {
      stack.push(text.slice(start, i).trim());
      start = i + 1;
    } else if (ch === '}') {
      stack.pop();
      start = i + 1;
    } else if (ch === ';') {
      const m = /^\s*--([\w-]+(?:-\*)?)\s*:\s*([\s\S]+)$/.exec(
        text.slice(start, i),
      );
      if (m) out.push({ name: m[1], value: m[2].trim(), blocks: [...stack] });
      start = i + 1;
    }
  }
  return out;
}

/* Which mode a declaration belongs to, from the blocks around it. */
function modeOf(blocks) {
  const all = blocks.join(' ');
  if (/\.dark\b/.test(all)) return 'dark';
  if (/prefers-reduced-motion/.test(all)) return 'reducedMotion';
  if (/@media[^{]*width\s*<\s*48rem/.test(all)) return 'phone';
  if (/@media/.test(all)) return null; // a media query nobody mapped: fail below
  return 'default';
}

/* ------------------------------------------------------------------ colours */

const round = (v, places = 3) => {
  const n = Number(v.toFixed(places));
  return Object.is(n, -0) ? 0 : n;
};

/* oklch → sRGB hex, Björn Ottosson's reference matrices, clipped to the sRGB gamut. */
export function oklchToHex(l, c, h) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const gamma = (v) =>
    v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return (
    '#' +
    linear
      .map((v) => Math.round(Math.min(1, Math.max(0, gamma(v))) * 255))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

const OKLCH =
  /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/;

/* --------------------------------------------------------- value conversion */

/*
 * One CSS value as a DTCG token: { $type, $value, $description? }. `vars`
 * resolves `var(--x)` and `calc(var(--x) * n)` against the default mode.
 */
export function toToken(name, raw, vars) {
  let value = raw.trim();
  const ref = /^var\(--([\w-]+)\)$/.exec(value);
  if (ref) {
    if (!vars.has(ref[1]))
      throw new Error(`--${name}: --${ref[1]} isn't a token`);
    return {
      ...toToken(name, vars.get(ref[1]), vars),
      $description: `Same as --${ref[1]}.`,
    };
  }
  const calc = /^calc\(\s*var\(--([\w-]+)\)\s*\*\s*([\d.]+)\s*\)$/.exec(value);
  if (calc) {
    const base = toToken(name, vars.get(calc[1]) ?? '', vars);
    if (base.$type !== 'dimension')
      throw new Error(`--${name}: can't scale ${value}`);
    const px = round(base.$value.value * Number(calc[2]));
    return {
      $type: 'dimension',
      $value: { value: px, unit: 'px' },
      $description: `--${calc[1]} × ${calc[2]}.`,
    };
  }

  const colour = OKLCH.exec(value);
  if (colour) {
    const [l, c, h] = colour.slice(1, 4).map(Number);
    const alpha =
      colour[4] === undefined ? 1 : Number(colour[4]) / (colour[5] ? 100 : 1);
    return {
      $type: 'color',
      $value: {
        colorSpace: 'oklch',
        components: [l, c, h],
        ...(alpha < 1 ? { alpha: round(alpha) } : {}),
        hex: oklchToHex(l, c, h),
      },
    };
  }
  const bezier = /^cubic-bezier\(([^)]+)\)$/.exec(value);
  if (bezier) {
    return {
      $type: 'cubicBezier',
      $value: bezier[1].split(',').map((n) => Number(n)),
    };
  }
  const size = /^(-?[\d.]+)(rem|px|ms|s|em)?$/.exec(value);
  if (size) {
    const n = Number(size[1]);
    const unit = size[2];
    if (unit === 'ms' || unit === 's')
      return { $type: 'duration', $value: { value: n, unit } };
    if (unit === 'rem') {
      return {
        $type: 'dimension',
        $value: { value: round(n * REM), unit: 'px' },
        $description: `${n}rem in code.`,
      };
    }
    if (unit === 'px')
      return { $type: 'dimension', $value: { value: n, unit: 'px' } };
    if (name.endsWith('-weight')) return { $type: 'fontWeight', $value: n };
    return {
      $type: 'number',
      $value: n,
      $description:
        unit === 'em'
          ? `${n}em in code: a share of the font size, which a Figma variable can't hold.`
          : undefined,
    };
  }
  const family = /^'([^']+)'/.exec(value) ?? /^"([^"]+)"/.exec(value);
  if (family) {
    return {
      $type: 'fontFamily',
      $value: family[1],
      $description: `${value} in code.`,
    };
  }
  throw new Error(`--${name}: no token type for "${value}"`);
}

/* ------------------------------------------------------------- the document */

function tokenPath(name, { prefix = '', split = false }) {
  let rest = name.startsWith(prefix) ? name.slice(prefix.length) : name;
  if (rest === '' || name === prefix.replace(/-$/, '')) rest = 'base';
  if (!split) return [rest];
  const at = rest.lastIndexOf('-');
  return at === -1 ? [rest] : [rest.slice(0, at), rest.slice(at + 1)];
}

const clean = (token) =>
  Object.fromEntries(Object.entries(token).filter(([, v]) => v !== undefined));

/* The whole DTCG document, from the CSS files keyed by file name. */
export function buildTokens(files) {
  const unknown = Object.keys(files).filter(
    (f) => !FILES[f] && declarations(files[f]).some((d) => !isIgnored(d)),
  );
  if (unknown.length) {
    throw new Error(
      `${unknown.join(', ')} declare tokens this script doesn't know about. Add them to FILES in scripts/tokens.mjs.`,
    );
  }

  /* Every value by name, per mode, for var() and calc(): a mode's overrides on top of the defaults. */
  const byMode = { default: new Map() };
  for (const css of Object.values(files)) {
    for (const d of declarations(css)) {
      if (isIgnored(d)) continue;
      const mode = modeOf(d.blocks) ?? 'unmapped';
      (byMode[mode] ??= new Map()).set(d.name, d.value);
    }
  }
  const varsFor = (mode) =>
    new Map([...byMode.default, ...(byMode[mode] ?? [])]);

  const doc = {
    $description:
      'Generated from packages/ui/src/theme by `pnpm tokens`. Edit the CSS, never this file.',
  };
  for (const [file, rule] of Object.entries(FILES)) {
    if (files[file] === undefined) continue;
    const collection = (doc[rule.collection] ??= {});
    const modes = rule.modes ??
      FILES[firstFileFor(rule.collection)]?.modes ?? { default: 'Default' };
    const modeNames = Object.values(modes);
    const byName = new Map();
    for (const d of declarations(files[file])) {
      if (isIgnored(d)) continue;
      const inTheme = d.blocks.some((b) => b.startsWith('@theme'));
      if (inTheme !== Boolean(rule.theme)) continue;
      const mode = modeOf(d.blocks);
      if (!mode || !modes[mode]) {
        throw new Error(
          `${file}: --${d.name} sits in a block with no mode (${d.blocks.join(' › ')})`,
        );
      }
      const entry = byName.get(d.name) ?? {};
      entry[mode] = d.value;
      byName.set(d.name, entry);
    }
    for (const [name, values] of byName) {
      if (values.default === undefined)
        throw new Error(`${file}: --${name} has no default value`);
      const perMode = Object.keys(modes).map((m) =>
        toToken(name, values[m] ?? values.default, varsFor(m)),
      );
      const [first, ...others] = perMode;
      const token = clean({ ...first });
      if (modeNames.length > 1) {
        token.$extensions = {
          [MCP]: {
            primaryMode: modeNames[0],
            modes: Object.fromEntries(
              others.map((t, i) => [modeNames[i + 1], t.$value]),
            ),
          },
        };
      }
      const keys = tokenPath(name, rule);
      let group = collection;
      for (const key of keys.slice(0, -1)) group = group[key] ??= {};
      group[keys.at(-1)] = token;
    }
  }
  return doc;
}

function firstFileFor(collection) {
  return Object.keys(FILES).find(
    (f) => FILES[f].collection === collection && FILES[f].modes,
  );
}

/* Not tokens: Tailwind resets (`--color-*: initial`) and variables set inside a utility. */
function isIgnored(d) {
  return (
    d.name.endsWith('-*') || d.blocks.some((b) => b.startsWith('@utility'))
  );
}

/* Formatted the way `pnpm format` would, so the two never fight over the file. */
export async function render(doc) {
  const prettier = await import('prettier');
  const options = (await prettier.resolveConfig(OUTPUT)) ?? {};
  return prettier.format(JSON.stringify(doc), { ...options, filepath: OUTPUT });
}

export function readThemeFiles(dir = THEME) {
  return Object.fromEntries(
    Object.keys(FILES).map((f) => [f, readFileSync(path.join(dir, f), 'utf8')]),
  );
}

/* ---------------------------------------------------------------------- CLI */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = await render(buildTokens(readThemeFiles()));
  const rel = path.relative(process.cwd(), OUTPUT);
  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(OUTPUT, 'utf8');
    } catch {
      /* missing counts as out of date */
    }
    if (current !== out) {
      console.error(
        `\n${rel} is out of date with the theme CSS. Run: pnpm tokens\n`,
      );
      process.exit(1);
    }
    console.log(`${rel} is up to date.`);
  } else {
    writeFileSync(OUTPUT, out);
    console.log(`Wrote ${rel}.`);
  }
}
