/*
 * The parity check's rules, kept free of the browser so each one can be tested
 * on its own. `audit.mjs` measures the page and feeds the numbers in here.
 *
 * A row's status is one of:
 *   ok           matches
 *   FAIL         differs
 *   UNACCOUNTED  a Figma layer the map neither points at nor skips
 *   SKIP         left out on purpose, with the reason in `actual`
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const CONFIG_DEFAULTS = {
  files: { design: null, library: null },
  direction: 'figma-first',
  storybookUrl: 'http://localhost:6006',
  tokens: {},
  textStyles: {},
  care: null,
  grid: null,
};

export function readConfig(repoRoot) {
  const file = path.join(repoRoot, 'figma.json');
  if (!existsSync(file)) return { ...CONFIG_DEFAULTS };
  return { ...CONFIG_DEFAULTS, ...JSON.parse(readFileSync(file, 'utf8')) };
}

/*
 * Every layer with a stable path: rooted at "root" (a variant's own name
 * changes per variant), and siblings that share a name numbered `#2`, `#3`, so
 * the map can point at each one. The extractor numbers them the same way.
 */
export function flatten(tree) {
  const out = [];
  const visit = (node, here, parent) => {
    out.push({ path: here, node, parent });
    const seen = new Map();
    for (const child of node.children ?? []) {
      const n = (seen.get(child.name) ?? 0) + 1;
      seen.set(child.name, n);
      visit(child, `${here}/${child.name}${n > 1 ? `#${n}` : ''}`, here);
    }
  };
  visit(tree, 'root', null);
  return out;
}

/*
 * The tree a map checks: `sets.0`, `nodes.1`, or a layer inside one
 * (`nodes.0/Nav / Bottom/Nav / Row`, the path `--layers` prints without
 * `root/`). Layer names may hold slashes, so the path is matched whole.
 * `variant` picks a variant of the set by name or by one of its values.
 */
export function pickTree(spec, ref, variant) {
  const [, base = 'sets.0', rest] =
    /^(set|sets\.\d+|nodes\.\d+)?(?:\/(.+))?$/.exec(ref ?? '') ?? [];
  let tree;
  const set = /^sets?(?:\.(\d+))?$/.exec(base);
  if (set) {
    const s = spec.sets?.[Number(set[1] ?? 0)];
    tree = s?.baseVariant?.tree;
    if (!s && !ref) tree = spec.nodes?.[0]?.tree;
    if (variant && s) {
      const rec = s.variants?.find(
        (v) =>
          v.name === variant || Object.values(v.props ?? {}).includes(variant),
      );
      if (!rec) return undefined;
      tree = applyVariant(tree, rec.changes ?? []);
    }
  } else {
    const node = /^nodes\.(\d+)$/.exec(base);
    tree = node ? spec.nodes?.[Number(node[1])]?.tree : undefined;
  }
  if (!tree || !rest) return tree;
  return flatten(tree).find((e) => e.path === `root/${rest}`)?.node;
}

/* A variant rebuilt from the base variant and its recorded differences. */
export function applyVariant(base, changes) {
  const tree = structuredClone(base);
  const byPath = () => new Map(flatten(tree).map((e) => [e.path, e]));
  let index = byPath();
  const added = [
    ...new Set(
      changes
        .filter((c) => c.prop === '(node)' && c.to === 'present')
        .map((c) => c.path),
    ),
  ].sort((a, b) => a.length - b.length);
  for (const p of added) {
    const parentPath = [...index.keys()]
      .filter((k) => p.startsWith(`${k}/`))
      .sort((a, b) => b.length - a.length)[0];
    const parent = index.get(parentPath)?.node;
    if (!parent) continue;
    const name = p.slice(parentPath.length + 1).replace(/#\d+$/, '');
    (parent.children ??= []).push({ name });
    index = byPath();
  }
  const removed = [];
  for (const c of changes) {
    const entry = index.get(c.path);
    if (!entry) continue;
    if (c.prop === '(node)') {
      if (c.to === null) removed.push(entry);
      continue;
    }
    if (c.to === null) delete entry.node[c.prop];
    else entry.node[c.prop] = structuredClone(c.to);
  }
  for (const { node, parent } of removed) {
    const p = index.get(parent)?.node;
    if (p) p.children = p.children.filter((k) => k !== node);
  }
  return tree;
}

/*
 * The CSS variable a Figma variable is: the project's own map in figma.json,
 * else the whole name slugged (`Content/Primary` → `--content-primary`).
 * Never a guess from part of the name: `text/primary` isn't `--primary`.
 */
export function cssVarsFor(token, tokenMap = {}) {
  if (!token) return [];
  if (tokenMap[token]) return [tokenMap[token]];
  const parts = token
    .split('/')
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '-'));
  return [`--${parts.join('-')}`];
}

/* A token's value in Figma for this mode, from the snapshot. */
export function figmaTokenValue(tokens, token, mode, drawnIn) {
  const byMode = tokens?.[token];
  if (!byMode) return null;
  const keys = Object.keys(byMode);
  const key =
    keys.find((k) => k.toLowerCase() === mode) ??
    (keys.length === 1 && (!drawnIn || mode === drawnIn) ? keys[0] : null);
  return key ? byMode[key] : null;
}

/*
 * Any CSS colour the page hands back, as sRGB, by the colour maths in CSS
 * Color 4. A canvas would round translucent colours (white at 10% came back
 * as 245,255,255). Returns null for a form it doesn't know.
 */
export function toRgb(value) {
  if (value == null) return null;
  const s = String(value).trim().toLowerCase();
  if (s === 'transparent') return 'rgba(0, 0, 0, 0)';
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    const n = (i) => Number.parseInt(h.slice(i, i + 2), 16);
    return fmt(n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1);
  }
  m = /^([a-z-]+)\((.*)\)$/.exec(s);
  if (!m) return null;
  const [fn, body] = [m[1], m[2]];
  const [main, alphaPart] = body.includes('/')
    ? body.split('/')
    : [body, undefined];
  const parts = main.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const val = (v, scale = 1) =>
    v === 'none' || v == null
      ? 0
      : v.endsWith('%')
        ? (Number.parseFloat(v) / 100) * scale
        : Number.parseFloat(v);
  let alpha = alphaPart === undefined ? undefined : val(alphaPart.trim(), 1);
  if (fn === 'rgb' || fn === 'rgba') {
    if (alpha === undefined && parts.length > 3) alpha = val(parts[3], 1);
    return fmt(
      val(parts[0], 255),
      val(parts[1], 255),
      val(parts[2], 255),
      alpha ?? 1,
    );
  }
  if (fn === 'color') {
    const space = parts.shift();
    const c = parts.map((v) => val(v, 1));
    if (space === 'srgb')
      return fmt(c[0] * 255, c[1] * 255, c[2] * 255, alpha ?? 1);
    if (space === 'srgb-linear') return fmt(...c.map(gamma), alpha ?? 1);
    return null;
  }
  if (fn === 'oklch' || fn === 'oklab') {
    const L = val(parts[0], 1);
    let a;
    let b;
    if (fn === 'oklch') {
      const C = val(parts[1], 0.4);
      const H = (val(parts[2]) * Math.PI) / 180;
      a = C * Math.cos(H);
      b = C * Math.sin(H);
    } else {
      a = val(parts[1], 0.4);
      b = val(parts[2], 0.4);
    }
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const ss = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return fmt(
      gamma(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss),
      gamma(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss),
      gamma(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss),
      alpha ?? 1,
    );
  }
  return null;
}
function gamma(x) {
  const v = Math.max(0, Math.min(1, x));
  return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
}
function fmt(r, g, b, a) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgba(${c(r)}, ${c(g)}, ${c(b)}, ${Math.round(a * 1000) / 1000})`;
}

/* Every colour inside a value (a box-shadow) as sRGB. */
export function colorsToRgb(value) {
  return String(value ?? '').replace(
    /(oklch|oklab|color|rgba?)\([^)]*\)/g,
    (c) => toRgb(c) ?? c,
  );
}

/* A colour with its alpha multiplied: a fill seen through layer opacity. */
export function withAlpha(value, factor) {
  const n = normColor(value);
  if (!n || n === 'transparent' || factor === 1 || factor == null) return n;
  const p = n.split(',').map(Number);
  if (p.length !== 4 || p.some(Number.isNaN)) return n;
  const a = Math.round(p[3] * factor * 100) / 100;
  return a === 0 ? 'transparent' : `${p[0]},${p[1]},${p[2]},${a}`;
}

/* The tool's saved output may wrap the snapshot; find it. */
export function findSnapshot(value, depth = 0) {
  if (depth > 6 || value == null) return null;
  if (typeof value === 'string') {
    try {
      return findSnapshot(JSON.parse(value), depth + 1);
    } catch {
      return null;
    }
  }
  if (typeof value !== 'object') return null;
  if (value._meta?.schemaVersion) return value;
  for (const v of Array.isArray(value) ? value : Object.values(value)) {
    const found = findSnapshot(v, depth + 1);
    if (found) return found;
  }
  return null;
}

export function normColor(value) {
  if (value == null) return null;
  const s = String(value).trim().toLowerCase();
  if (s === 'transparent' || s === 'rgba(0, 0, 0, 0)') return 'transparent';
  let m = /^#([0-9a-f]{6})$/.exec(s);
  if (m) {
    const n = Number.parseInt(m[1], 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},1`;
  }
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    const a = p.length > 3 ? Math.round(p[3] * 100) / 100 : 1;
    if (a === 0) return 'transparent';
    return `${Math.round(p[0])},${Math.round(p[1])},${Math.round(p[2])},${a}`;
  }
  return s;
}

/* Two colours match when each channel is within 2/255 (rounding in Figma). */
export function sameColor(a, b) {
  const x = normColor(a);
  const y = normColor(b);
  if (x === y) return true;
  if (!x || !y || x === 'transparent' || y === 'transparent') return false;
  const p = x.split(',').map(Number);
  const q = y.split(',').map(Number);
  if (p.length !== 4 || q.length !== 4 || p.some(Number.isNaN)) return false;
  return (
    p.slice(0, 3).every((v, i) => Math.abs(v - q[i]) <= 2) &&
    Math.abs(p[3] - q[3]) <= 0.02
  );
}

/* "24px" → 24, "150%" of a 16px font → 24, "AUTO" or "normal" → null. */
export function px(value, fontSize) {
  if (value == null) return null;
  const s = String(value).trim();
  if (s === 'AUTO' || s === 'normal') return null;
  if (s.endsWith('%')) return (Number.parseFloat(s) / 100) * fontSize;
  const n = Number.parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

/* Splits a computed box-shadow into its shadows, ignoring commas inside rgb(). */
export function parseShadows(value) {
  if (!value || value === 'none') return [];
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '(') depth += 1;
    else if (value[i] === ')') depth -= 1;
    else if (value[i] === ',' && depth === 0) {
      parts.push(value.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(value.slice(start));
  return parts
    .map((part) => {
      const color = /(rgba?\([^)]*\)|#[0-9a-f]{3,8})/i.exec(part)?.[0] ?? null;
      const numbers = part
        .replace(color ?? '', '')
        .match(/-?[\d.]+px|-?[\d.]+(?=\s|$)/g)
        ?.map((n) => Number.parseFloat(n)) ?? [0, 0, 0, 0];
      const [x = 0, y = 0, blur = 0, spread = 0] = numbers;
      return { inset: /\binset\b/.test(part), x, y, blur, spread, color };
    })
    .filter(
      /* Tailwind stacks unused shadow slots as transparent; they draw nothing. */
      (s) => normColor(s.color) !== 'transparent',
    );
}

export const hasText = (node) =>
  Boolean(node.text) || (node.children ?? []).some(hasText);

/* The font families a tree's text is set in. */
export function familiesIn(node, out = new Set()) {
  if (node.text?.family && node.text.family !== 'MIXED')
    out.add(node.text.family);
  for (const c of node.children ?? []) familiesIn(c, out);
  return out;
}

/* Why a size can't be trusted yet: a Figma font this page doesn't have. */
function standIn(node, ctx) {
  if (ctx.realFonts) return null;
  const missing = [...familiesIn(node)].filter((f) =>
    (ctx.fontsMissing ?? []).includes(f),
  );
  return missing.length
    ? `"${missing.join('", "')}" isn't on this page, a stand-in draws it`
    : null;
}

const visibleSolid = (paint) => paint && paint.hex !== undefined;

const asList = (value) =>
  value == null ? [] : Array.isArray(value) ? value : [value];

/*
 * What a paint should look like in the page: the resolved token when the
 * layer binds one, else the raw colour. A raw colour is only meaningful in the
 * mode the frame was drawn in.
 */
function expectedPaint(paint, ctx) {
  if (paint.token) {
    const resolved = ctx.tokenValues?.[paint.token];
    /* A paint's own opacity applies on top of the token's colour. */
    const alpha = Number(String(normColor(paint.hex) ?? '').split(',')[3] ?? 1);
    if (resolved)
      return {
        label: `${paint.token}${alpha < 1 ? ` at ${alpha}` : ''} → ${withAlpha(resolved, alpha)}`,
        value: withAlpha(resolved, alpha),
      };
    return {
      label: `${paint.token} (raw ${paint.hex})`,
      value: paint.hex,
      raw: true,
      unmapped: true,
    };
  }
  return { label: paint.hex, value: paint.hex, raw: true };
}

/*
 * Compares one Figma layer against the measured element. `got` is what
 * `measure()` in audit.mjs returns; `ctx` carries the resolved token values,
 * the text-style map, the mode, and the mode the frame was drawn in.
 */
export function compareNode(nodePath, node, got, ctx, excused = {}) {
  const rows = [];
  const add = (group, prop, expected, actual, ok) => {
    const why = excused[`${group}.${prop}`];
    if (why) {
      rows.push({
        path: nodePath,
        group,
        prop,
        expected,
        actual: `${actual} — ${why}`,
        status: 'SKIP',
      });
      return;
    }
    rows.push({
      path: nodePath,
      group,
      prop,
      expected,
      actual,
      status: ok ? 'ok' : 'FAIL',
    });
  };
  const skip = (group, prop, expected, reason) =>
    rows.push({
      path: nodePath,
      group,
      prop,
      expected,
      actual: reason,
      status: 'SKIP',
    });
  const near = (a, b, tolerance = 1) => Math.abs(a - b) <= tolerance;
  const rawInThisMode = !ctx.drawnIn || ctx.mode === ctx.drawnIn;

  /* Box. Text sized by a font this page doesn't have can't be measured
   * against Figma yet: a hug width, and the height of text that wraps. */
  const font = standIn(node, ctx);
  const [hugW, hugH] = String(node.sizing ?? '').split('/');
  if (ctx.sharesParent) {
    /* Text drawn by its parent's element (a label in a button) has no box of its own. */
    if (node.w != null)
      skip('box', 'w', node.w, `${got.w} — drawn by its parent's element`);
    if (node.h != null)
      skip('box', 'h', node.h, `${got.h} — drawn by its parent's element`);
  } else if (node.w != null) {
    if (font && (hugW === 'HUG' || (node.type === 'TEXT' && hugW !== 'FIXED')))
      skip('box', 'w', node.w, `${got.w} — ${font}`);
    else add('box', 'w', node.w, got.w, near(node.w, got.w));
  }
  if (node.h != null && !ctx.sharesParent) {
    if (font && (node.type === 'TEXT' || hugH === 'HUG'))
      skip('box', 'h', node.h, `${got.h} — ${font}`);
    else add('box', 'h', node.h, got.h, near(node.h, got.h));
  }

  if (node.layout) {
    const want = node.layout.pad.split(',').map(Number);
    add(
      'spacing',
      'pad',
      node.layout.pad,
      got.padding.join(','),
      want.every((v, i) => near(v, got.padding[i])),
    );
    if (node.layout.main === 'SPACE_BETWEEN') {
      skip(
        'spacing',
        'gap',
        'space between',
        'spread to fill; checked through the boxes',
      );
    } else if ((node.children ?? []).length > 1) {
      const gap = node.layout.dir === 'VERTICAL' ? got.rowGap : got.columnGap;
      const gotGap = gap === 'normal' ? 0 : Math.round(Number.parseFloat(gap));
      add(
        'spacing',
        'gap',
        node.layout.gap,
        gotGap,
        near(node.layout.gap, gotGap),
      );
    }
  }

  /* A leaf's layer opacity and its colour make one look: white at 80%
   * opacity and 80%-white text are the same, so they're checked together. */
  const leaf = !(node.children ?? []).length;
  const fadeWant = leaf ? (node.opacity ?? 1) : 1;
  const fadeGot = leaf ? (got.opacity ?? 1) : 1;
  if (typeof node.opacity === 'number' && !leaf)
    add(
      'paint',
      'opacity',
      node.opacity,
      got.opacity,
      near(node.opacity, got.opacity, 0.01),
    );

  /* Fills. On text the fill is the text colour. Figma stacks fills bottom to
   * top, so the last visible one is what shows. */
  const fills = asList(node.fill);
  const top = fills.at(-1);
  const target = node.type === 'TEXT' ? 'color' : 'backgroundColor';
  if (fills.length > 1 && fills.slice(0, -1).some(visibleSolid))
    skip(
      'paint',
      'fill',
      `${fills.length} fills`,
      'several stacked fills; check the picture',
    );
  if (top && visibleSolid(top)) {
    const want = expectedPaint(top, ctx);
    if (want.raw && !rawInThisMode)
      skip(
        'paint',
        'fill',
        want.label,
        `no token; only checked in ${ctx.drawnIn}`,
      );
    else
      add(
        'paint',
        'fill',
        fadeWant === 1 ? want.label : `${want.label} × ${fadeWant}`,
        withAlpha(got[target], fadeGot),
        sameColor(
          withAlpha(want.value, fadeWant),
          withAlpha(got[target], fadeGot),
        ),
      );
    if (want.unmapped)
      add(
        'paint',
        'token',
        top.token,
        'no CSS variable; map it in figma.json tokens',
        false,
      );
    /* The page's token can be wrong too: check it against Figma's own value. */
    const figmaValue =
      top.token && !want.unmapped
        ? figmaTokenValue(ctx.figmaTokens, top.token, ctx.mode, ctx.drawnIn)
        : null;
    if (figmaValue && typeof figmaValue === 'string')
      add(
        'paint',
        'token value',
        `${top.token} in Figma ${normColor(figmaValue)}`,
        normColor(ctx.tokenValues[top.token]),
        sameColor(figmaValue, ctx.tokenValues[top.token]),
      );
  } else if (leaf && typeof node.opacity === 'number') {
    add(
      'paint',
      'opacity',
      node.opacity,
      got.opacity,
      near(node.opacity, got.opacity, 0.01),
    );
  }
  if (top && String(top.type).startsWith('GRADIENT')) {
    add(
      'paint',
      'fill',
      `${top.type.toLowerCase()} gradient`,
      got.backgroundImage,
      /gradient\(/.test(got.backgroundImage ?? ''),
    );
  } else if (top?.type === 'IMAGE') {
    add(
      'paint',
      'fill',
      'image',
      got.backgroundImage === 'none' ? got.tag : 'background image',
      got.tag === 'img' || /url\(/.test(got.backgroundImage ?? ''),
    );
  } else if (
    fills.length === 0 &&
    node.type !== 'TEXT' &&
    node.type !== 'VECTOR'
  ) {
    /* No fill is a value: the design paints nothing here. */
    add(
      'paint',
      'fill',
      'none',
      normColor(got.backgroundColor),
      normColor(got.backgroundColor) === 'transparent' &&
        (got.backgroundImage ?? 'none') === 'none',
    );
  }

  /* Strokes, per side. CSS draws them as borders. */
  const stroke = asList(node.stroke).at(-1);
  const sides = ['top', 'right', 'bottom', 'left'];
  if (stroke && visibleSolid(stroke)) {
    const weights = node.strokeWeights
      ? node.strokeWeights.split(',').map(Number)
      : sides.map(() => Number(node.strokeWeight ?? 0));
    add(
      'paint',
      'stroke width',
      weights.join(','),
      got.borderWidths.join(','),
      weights.every((w, i) => near(w, got.borderWidths[i], 0.5)),
    );
    const want = expectedPaint(stroke, ctx);
    const side = weights.findIndex((w) => w > 0);
    if (side >= 0) {
      if (want.raw && !rawInThisMode)
        skip(
          'paint',
          'stroke',
          want.label,
          `no token; only checked in ${ctx.drawnIn}`,
        );
      else
        add(
          'paint',
          'stroke',
          want.label,
          normColor(got.borderColors[side]),
          sameColor(want.value, got.borderColors[side]),
        );
    }
  } else if (
    node.type !== 'TEXT' &&
    got.borderWidths.some(
      (w, i) => w > 0 && normColor(got.borderColors[i]) !== 'transparent',
    )
  ) {
    add('paint', 'stroke width', '0,0,0,0', got.borderWidths.join(','), false);
  }

  if (node.radius != null) {
    const want =
      typeof node.radius === 'number'
        ? [node.radius, node.radius, node.radius, node.radius]
        : String(node.radius).split('/').map(Number);
    /* A radius past half the height is a pill in both tools. */
    const cap = Math.min(got.w, got.h) / 2;
    const fit = (r) => Math.min(r, cap);
    add(
      'paint',
      'radius',
      want.join('/'),
      got.radii.join('/'),
      want.every((r, i) => near(fit(r), fit(got.radii[i]))),
    );
  }

  /* Shadows: compared as a set, since the two tools stack them in opposite
   * orders. A text layer's shadow is a text-shadow. */
  const isText = node.type === 'TEXT';
  const shadows = (node.effects ?? []).filter(
    (e) => /SHADOW/.test(e.type) && !(isText && e.type === 'INNER_SHADOW'),
  );
  const gotShadows = parseShadows(isText ? got.textShadow : got.boxShadow);
  if (shadows.length || gotShadows.length) {
    const key = (s) =>
      `${s.inset ? 'in' : 'out'} ${s.x},${s.y} ${s.blur} ${s.spread}`;
    const want = shadows.map((e) => {
      const [x, y] = (e.offset ?? '0,0').split(',').map(Number);
      return {
        inset: e.type === 'INNER_SHADOW',
        x,
        y,
        blur: e.radius ?? 0,
        spread: isText ? 0 : (e.spread ?? 0),
        color: e.token ? (ctx.tokenValues?.[e.token] ?? e.color) : e.color,
      };
    });
    const sort = (list) =>
      [...list].sort((a, b) => key(a).localeCompare(key(b)));
    const a = sort(want);
    const b = sort(gotShadows);
    const ok =
      a.length === b.length &&
      a.every(
        (s, i) =>
          s.inset === b[i].inset &&
          near(s.x, b[i].x) &&
          near(s.y, b[i].y) &&
          near(s.blur, b[i].blur) &&
          near(s.spread, b[i].spread) &&
          (!s.color || sameColor(s.color, b[i].color)),
      );
    add(
      'effects',
      isText ? 'text shadow' : 'shadow',
      a.map(key).join(' | ') || 'none',
      b.map(key).join(' | ') || 'none',
      ok,
    );
  }
  const glass = (node.effects ?? []).find((e) => e.type === 'GLASS');
  if (glass)
    add(
      'effects',
      'glass',
      `glass, frost ${glass.radius ?? '?'}px`,
      got.backdropFilter,
      /blur\(/.test(got.backdropFilter ?? ''),
    );
  const blur = (node.effects ?? []).find((e) => /BLUR/.test(e.type));
  if (blur) {
    const css =
      blur.type === 'BACKGROUND_BLUR' ? got.backdropFilter : got.filter;
    add(
      'effects',
      'blur',
      blur.type.toLowerCase(),
      css,
      /blur\(/.test(css ?? ''),
    );
  }

  if (node.text) {
    const t = node.text;
    if (t.trim)
      add(
        'type',
        'trim',
        t.trim,
        got.textBoxTrim ?? 'none',
        /trim-both|trim-start|trim-end/.test(got.textBoxTrim ?? ''),
      );
    if (t.size != null)
      add(
        'type',
        'size',
        t.size,
        got.fontSize,
        near(t.size, got.fontSize, 0.5),
      );
    /* Figma reports the weight of whatever font it fell back to, so the named
     * text style is the truth. figma.json maps it to our composite. */
    const composite = t.style ? ctx.textStyles?.[t.style] : null;
    if (composite) {
      add(
        'type',
        'style',
        `${t.style} → ${composite}`,
        got.typeClasses.join(' ') || 'no type-* class',
        got.typeClasses.includes(composite),
      );
    } else if (t.style) {
      skip(
        'type',
        'style',
        t.style,
        'not in figma.json textStyles; add it to check the composite',
      );
      if (t.weight != null)
        add(
          'type',
          'weight',
          t.weight,
          got.fontWeight,
          t.weight === got.fontWeight,
        );
    } else if (t.weight != null) {
      add(
        'type',
        'weight',
        t.weight,
        got.fontWeight,
        t.weight === got.fontWeight,
      );
    }
    const lh = px(t.lineHeight, t.size ?? got.fontSize);
    if (lh != null) {
      const gotLh = px(got.lineHeight, got.fontSize);
      add(
        'type',
        'line height',
        t.lineHeight,
        got.lineHeight,
        gotLh != null && near(lh, gotLh, 0.5),
      );
    }
    const ls = px(t.letterSpacing, t.size ?? got.fontSize);
    if (ls != null) {
      const gotLs = px(got.letterSpacing, got.fontSize) ?? 0;
      add(
        'type',
        'letter spacing',
        t.letterSpacing,
        got.letterSpacing,
        near(ls, gotLs, 0.1),
      );
    }
    const cases = {
      UPPER: 'uppercase',
      LOWER: 'lowercase',
      TITLE: 'capitalize',
    };
    if (cases[t.case])
      add(
        'type',
        'case',
        t.case,
        got.textTransform,
        got.textTransform === cases[t.case],
      );
  }
  return rows;
}

/*
 * Order is part of the design: in an auto-layout frame the children's order is
 * the reading order. Checked on screen position, which is what people see.
 */
export function orderRows(flat, boxes) {
  const rows = [];
  for (const { path: parentPath, node } of flat) {
    const dir = node.layout?.dir;
    if (!dir || node.layout.wrap) continue;
    const kids = flat.filter(
      (entry) =>
        entry.parent === parentPath &&
        !entry.node.absolute &&
        boxes[entry.path],
    );
    if (kids.length < 2) continue;
    const axis = dir === 'VERTICAL' ? 'y' : 'x';
    const names = kids.map((k) => k.path.split('/').at(-1));
    const onScreen = [...kids]
      .sort((a, b) => boxes[a.path][axis] - boxes[b.path][axis])
      .map((k) => k.path.split('/').at(-1));
    rows.push({
      path: parentPath,
      group: 'order',
      prop: dir === 'VERTICAL' ? 'top to bottom' : 'left to right',
      expected: names.join(' › '),
      actual: onScreen.join(' › '),
      status: names.join('\n') === onScreen.join('\n') ? 'ok' : 'FAIL',
    });
  }
  return rows;
}

/*
 * Where each layer sits inside its mapped parent, within 1px. A layer mapped
 * to the same element as its parent has no position of its own. When a stand-in
 * font draws text in the parent, positions after it move, so those are skipped.
 */
export function positionRows(flat, boxes, selectors, ctx) {
  const rows = [];
  const byPath = new Map(flat.map((e) => [e.path, e]));
  for (const { path: p, node, parent } of flat) {
    if (!parent || node.x == null || !boxes[p] || !boxes[parent]) continue;
    if (selectors[p] === selectors[parent]) continue;
    const expected = `${node.x},${node.y}`;
    const dx = Math.round((boxes[p].x - boxes[parent].x) * 10) / 10;
    const dy = Math.round((boxes[p].y - boxes[parent].y) * 10) / 10;
    const font = standIn(byPath.get(parent).node, ctx);
    if (font) {
      rows.push({
        path: p,
        group: 'box',
        prop: 'position',
        expected,
        actual: `${dx},${dy} — ${font}`,
        status: 'SKIP',
      });
      continue;
    }
    rows.push({
      path: p,
      group: 'box',
      prop: 'position',
      expected,
      actual: `${dx},${dy}`,
      status:
        Math.abs(dx - node.x) <= 1 && Math.abs(dy - node.y) <= 1
          ? 'ok'
          : 'FAIL',
    });
  }
  return rows;
}

/* "Not built yet" isn't a reason. A skip names what makes building it impossible. */
export const NOT_A_REASON =
  /\b(todo|tbd|not (built|done|yet)|yet|later|open question|skip(ped)? for now|wip)\b/i;

/*
 * What the map says about every layer. A whole-layer skip, or a layer
 * `checkedIn` another map, covers everything inside it.
 *   { status: 'check', selector, excused } | { status: 'SKIP', reason }
 *   { status: 'UNACCOUNTED', reason } | { status: 'FAIL', reason }
 *   { status: 'covered' }  inside a skipped layer: no row
 */
export function resolveEntries(flat, nodes = {}, mapExists = () => true) {
  const out = new Map();
  const covering = [];
  for (const { path: p } of flat) {
    if (covering.some((c) => p.startsWith(`${c}/`))) {
      out.set(p, { status: 'covered' });
      continue;
    }
    const entry = nodes[p];
    const obj = entry && typeof entry === 'object' ? entry : null;
    if (entry === undefined) {
      out.set(p, { status: 'UNACCOUNTED', reason: 'not in the map' });
    } else if (obj?.checkedIn) {
      covering.push(p);
      out.set(
        p,
        mapExists(obj.checkedIn)
          ? { status: 'SKIP', reason: `checked in ${obj.checkedIn}` }
          : {
              status: 'FAIL',
              reason: `checkedIn names ${obj.checkedIn}, which has no map`,
            },
      );
    } else if (typeof obj?.skip === 'string') {
      covering.push(p);
      out.set(
        p,
        NOT_A_REASON.test(obj.skip)
          ? {
              status: 'FAIL',
              reason: `"${obj.skip}" isn't a reason: name what makes it impossible to build`,
            }
          : { status: 'SKIP', reason: obj.skip },
      );
    } else {
      const selector = typeof entry === 'string' ? entry : obj?.selector;
      out.set(
        p,
        selector
          ? { status: 'check', selector, excused: (obj && obj.skip) || {} }
          : { status: 'UNACCOUNTED', reason: 'selector not written yet' },
      );
    }
  }
  return out;
}

const VECTORS = new Set([
  'VECTOR',
  'BOOLEAN_OPERATION',
  'ELLIPSE',
  'LINE',
  'STAR',
  'POLYGON',
  'RECTANGLE',
]);
const onlyVectors = (node) =>
  (node.children ?? []).length > 0 &&
  node.children.every(
    (c) => VECTORS.has(c.type) || (c.type === 'GROUP' && onlyVectors(c)),
  );

/*
 * A starting map: every layer listed with an empty selector to fill in. An
 * icon (an instance or group made only of shapes) is one entry, not its paths.
 */
export function scaffoldMap(flat, { story, tree } = {}) {
  const nodes = {};
  const covered = [];
  for (const { path: p, node } of flat) {
    if (covered.some((c) => p.startsWith(`${c}/`))) continue;
    nodes[p] = '';
    if (p !== 'root' && onlyVectors(node)) covered.push(p);
  }
  return {
    story: story ?? '<story-id>',
    tree: tree ?? 'sets.0',
    drawnIn: 'light',
    nodes,
  };
}

/*
 * The extractor's warnings that concern this tree, grouped by kind. Older
 * snapshots hold plain strings, which can't be scoped and are kept as they are.
 */
export function scopeWarnings(warnings = [], flat) {
  const ids = new Set(flat.map((e) => e.node.id).filter(Boolean));
  const out = [];
  for (const w of warnings) {
    if (typeof w === 'string') {
      out.push({ kind: 'note', message: w, count: 1 });
      continue;
    }
    const count = w.ids?.length
      ? w.ids.filter((id) => ids.has(id)).length
      : w.count;
    if (count > 0) out.push({ kind: w.kind, message: w.message, count });
  }
  return out;
}

/*
 * The areas of a difference picture where most pixels differ, as tiles of
 * `tile` px: { x, y, w, h, share }, densest first. `png` is anything with
 * width, height and RGBA data; `mark` is the colour differing pixels are drawn in.
 */
export function hotRegions(png, mark, { tile = 32, min = 20, top = 3 } = {}) {
  const out = [];
  for (let ty = 0; ty < png.height; ty += tile) {
    for (let tx = 0; tx < png.width; tx += tile) {
      const w = Math.min(tile, png.width - tx);
      const h = Math.min(tile, png.height - ty);
      let hits = 0;
      for (let y = ty; y < ty + h; y += 1) {
        for (let x = tx; x < tx + w; x += 1) {
          const i = (y * png.width + x) * 4;
          if (
            png.data[i] === mark[0] &&
            png.data[i + 1] === mark[1] &&
            png.data[i + 2] === mark[2]
          )
            hits += 1;
        }
      }
      const share = Math.round((hits / (w * h)) * 100);
      if (share >= min) out.push({ x: tx, y: ty, w, h, share });
    }
  }
  return out.sort((a, b) => b.share - a.share).slice(0, top);
}

export function summarize(rows) {
  const counts = { ok: 0, FAIL: 0, UNACCOUNTED: 0, SKIP: 0 };
  for (const row of rows) counts[row.status] += 1;
  return { ...counts, bad: counts.FAIL + counts.UNACCOUNTED };
}

/* Every token the layers bind, so the page can resolve them in one pass. */
export function tokensIn(flat) {
  const names = new Set();
  for (const { node } of flat) {
    for (const p of [...asList(node.fill), ...asList(node.stroke)])
      if (p?.token) names.add(p.token);
    for (const e of node.effects ?? []) if (e.token) names.add(e.token);
  }
  return [...names];
}
