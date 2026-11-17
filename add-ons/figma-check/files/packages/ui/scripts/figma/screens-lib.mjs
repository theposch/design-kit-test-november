/*
 * Whole screens from Figma: how tidy a file is, which grid its screens
 * follow, and how a built screen compares with its frame. Pure functions over
 * extractor snapshots, so all of it is tested without Figma or a browser.
 */
import { NOT_A_REASON, sameColor, toRgb } from './lib.mjs';

/* Page-layout spacing in px: Tailwind steps 0, 1, 2, 4, 6, 8, 10, 12, 14, 16. */
export const PAGE_STEPS = [0, 4, 8, 16, 24, 32, 40, 48, 56, 64];

const CONTAINERS = new Set(['FRAME', 'COMPONENT', 'INSTANCE', 'COMPONENT_SET']);
const DEFAULT_NAME =
  /^(Frame|Group|Rectangle|Ellipse|Vector|Line|Union|Subtract|Intersect|Polygon|Star|Image)( \d+)?$/;

/*
 * Library names that are also everyday names for a wrapper frame. A frame
 * called "Text" or "Stack" is usually just a frame, not a detached copy.
 */
const GENERIC = new Set([
  'text',
  'stack',
  'grid',
  'layout',
  'center',
  'heading',
  'icon',
  'list',
  'thumbnail',
  'card',
  'image',
  'separator',
  'aspectratio',
  'content',
  'container',
  'wrapper',
  'row',
  'column',
  'section',
  'frame',
  'group',
]);

const round = (n) => Math.round(n);
const share = (part, whole) => (whole ? round((part / whole) * 100) : 100);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const normal = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/* Every layer with its position on the screen, not just inside its parent. */
export function placed(tree) {
  const out = [];
  const visit = (node, ax, ay, depth, parent, insideInstance) => {
    out.push({ node, ax, ay, depth, parent, insideInstance });
    for (const child of node.children ?? []) {
      visit(
        child,
        ax + (child.x ?? 0),
        ay + (child.y ?? 0),
        depth + 1,
        node,
        insideInstance || node.type === 'INSTANCE',
      );
    }
  };
  visit(tree, 0, 0, 0, null, false);
  return out;
}

const paints = (value) =>
  value === undefined || value === 'MIXED'
    ? []
    : (Array.isArray(value) ? value : [value]).filter(
        (p) => p && (p.hex || p.token),
      );

const screensOf = (spec) => (spec.nodes ?? []).map((n) => n.tree ?? n);

/*
 * How much of a file is set up for code: colours on tokens, text on styles,
 * frames with auto-layout, real components, real names. Layers inside an
 * instance belong to its component, so they're left out: a tidy library used
 * in a messy screen shouldn't make the screen look tidy.
 */
export function health(spec, { libraryNames = [] } = {}) {
  const c = {
    colours: 0,
    colourTokens: 0,
    texts: 0,
    textStyles: 0,
    frames: 0,
    autoLayout: 0,
    instances: 0,
    detached: [],
    defaultNames: 0,
    layers: 0,
    handPlaced: 0,
  };
  const all = screensOf(spec).flatMap(placed);
  const instanceNames = new Set(
    all
      .filter(({ node }) => node.type === 'INSTANCE' && node.component)
      .map(({ node }) => normal(node.component.name)),
  );
  /* Components this file uses always count; the code library's names only when they aren't everyday frame names. */
  const known = new Set([
    ...libraryNames.map(normal).filter((n) => !GENERIC.has(n)),
    ...instanceNames,
  ]);

  for (const { node, parent, insideInstance } of all) {
    if (insideInstance) continue;
    c.layers += 1;
    for (const p of [...paints(node.fill), ...paints(node.stroke)]) {
      c.colours += 1;
      if (p.token) c.colourTokens += 1;
    }
    if (node.text) {
      c.texts += 1;
      if (node.text.style || node.text.sizeToken) c.textStyles += 1;
    }
    if (node.type === 'INSTANCE') c.instances += 1;
    const kids = node.children?.length ?? 0;
    if ((CONTAINERS.has(node.type) || node.type === 'GROUP') && kids >= 2) {
      c.frames += 1;
      if (node.layout) c.autoLayout += 1;
    }
    if (parent && !parent.layout && parent.type !== 'INSTANCE')
      c.handPlaced += 1;
    if (DEFAULT_NAME.test(node.name)) c.defaultNames += 1;
    if (
      (node.type === 'FRAME' || node.type === 'GROUP') &&
      parent &&
      known.has(normal(node.name))
    )
      c.detached.push(node.name);
  }

  const ratios = {
    colourTokens: share(c.colourTokens, c.colours),
    textStyles: share(c.textStyles, c.texts),
    autoLayout: share(c.autoLayout, c.frames),
  };
  const verdict =
    ratios.colourTokens >= 80 &&
    ratios.textStyles >= 80 &&
    ratios.autoLayout >= 60 &&
    c.detached.length === 0
      ? 'tidy'
      : ratios.colourTokens < 40 || ratios.autoLayout < 30
        ? 'messy'
        : 'mixed';

  const detachedCounts = Object.entries(Object.groupBy(c.detached, (n) => n))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([n, list]) => `${n} ×${list.length}`);
  const parts = [
    c.colours
      ? `colours ${ratios.colourTokens}% on tokens`
      : 'no colours outside components',
    c.texts
      ? `text ${ratios.textStyles}% on styles`
      : 'no text outside components',
    `${c.autoLayout} of ${plural(c.frames, 'frame')} use auto-layout`,
    plural(c.instances, 'component instance'),
  ];
  if (c.detached.length)
    parts.push(
      `${plural(c.detached.length, 'detached copy', 'detached copies')} (${detachedCounts.join(', ')})`,
    );
  if (c.defaultNames)
    parts.push(`${plural(c.defaultNames, 'layer')} with default names`);
  return { verdict, counts: c, ratios, line: parts.join(', ') };
}

const mode = (values) => {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
};

/* How alike two layers are: the same component, or the same kind of layer with the same name (numbers aside). */
const kindOf = (k) =>
  k.component?.name ?? `${k.type}:${normal(k.name).replace(/\d+$/, '')}`;

/* The grid one screen follows: side margin, spacing used, rows of alike items. */
export function surveyScreen(tree) {
  const W = tree.w;
  const layers = placed(tree).filter(
    ({ node, depth, insideInstance }) =>
      depth > 0 && !insideInstance && node.w >= 4 && node.h >= 4,
  );

  /*
   * Content columns are wide and centred: their left and right insets match.
   * A centred logo or button sits the same distance from both edges too, so
   * only a block at least half the screen wide counts.
   */
  const insets = [];
  const lefts = [];
  for (const { node, ax } of layers) {
    if (node.absolute || node.w < W * 0.5) continue;
    const left = round(ax);
    const right = round(W - (ax + node.w));
    if (left <= 0 && right <= 0) continue;
    if (left > W / 4) continue;
    if (left > 0) lefts.push(left);
    if (Math.abs(left - right) <= 1 && left > 0) insets.push(left);
  }
  const margin = (mode(insets) ?? mode(lefts))?.[0] ?? null;

  const spacing = [];
  const rows = [];
  const scrollRows = [];
  for (const { node } of placed(tree)) {
    if (node.type === 'INSTANCE') continue;
    const kids = (node.children ?? []).filter((k) => !k.absolute);
    if (node.layout) {
      if (node.layout.gap > 0 && kids.length > 1)
        spacing.push(round(node.layout.gap));
    } else if (kids.length > 1) {
      const byY = [...kids].sort((a, b) => a.y - b.y);
      for (let i = 1; i < byY.length; i += 1) {
        const [a, b] = [byY[i - 1], byY[i]];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const gap = b.y - (a.y + a.h);
        if (overlapX > 0 && gap > 0 && gap < 200) spacing.push(round(gap));
      }
    }

    /* Items running past the frame's right edge: a row that scrolls sideways. */
    if (kids.length >= 2 && kids.some((k) => (k.x ?? 0) + k.w > node.w + 1)) {
      const sorted = [...kids].sort((a, b) => a.x - b.x);
      const gap = round(sorted[1].x - (sorted[0].x + sorted[0].w));
      if (gap >= 0 && gap <= 48 && kindOf(sorted[0]) === kindOf(sorted[1])) {
        scrollRows.push({ start: round(sorted[0].x), gap });
        if (gap > 0) spacing.push(gap);
        continue;
      }
    }

    /* Rows of two or more alike, same-size items, close together: cards, tiles, columns. */
    const byRow = Object.values(Object.groupBy(kids, (k) => round(k.y ?? 0)));
    for (const row of byRow) {
      if (row.length < 2) continue;
      const sorted = [...row].sort((a, b) => a.x - b.x);
      const alike = sorted.every(
        (k) =>
          Math.abs(k.w - sorted[0].w) <= 1 &&
          Math.abs(k.h - sorted[0].h) <= 1 &&
          kindOf(k) === kindOf(sorted[0]),
      );
      if (!alike || sorted[0].w < 40) continue;
      const gaps = sorted
        .slice(1)
        .map((k, i) => round(k.x - (sorted[i].x + sorted[i].w)));
      if (gaps.some((g) => g < 0 || g > 48 || Math.abs(g - gaps[0]) > 1))
        continue;
      rows.push({
        count: sorted.length,
        gap: gaps[0],
        width: round(sorted[0].w),
      });
      if (gaps[0] > 0) spacing.push(gaps[0]);
    }
  }
  return {
    width: round(W),
    margin,
    spacing,
    rows,
    scrollRows,
    grids: tree.grids ?? [],
  };
}

export function nearestSteps(value, steps = PAGE_STEPS) {
  if (steps.includes(value)) return [value];
  const lower = [...steps].reverse().find((s) => s < value);
  const upper = steps.find((s) => s > value);
  return [lower, upper].filter((s) => s !== undefined);
}

/* Each pattern once per screen, so one busy screen doesn't look like a habit. */
function perScreen(found, list, keyOf) {
  const counts = new Map();
  for (const s of found)
    for (const key of new Set(s[list].map(keyOf)))
      counts.set(key, (counts.get(key) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, screens]) => {
      const [a, b] = key.split('|').map(Number);
      return { a, b, screens };
    })
    .sort((x, y) => y.screens - x.screens);
}

/*
 * Across several screens: the margin most of them share, the spacing steps
 * that keep coming back, repeating rows, and the screens that break the
 * pattern. A finding, not a rule: the person confirms it before it's saved.
 */
export function survey(screens) {
  const found = screens.map(({ name, tree }) => ({
    name,
    ...surveyScreen(tree),
  }));
  const margins = found.map((s) => ({ name: s.name, margin: s.margin }));
  const [common, commonCount] = mode(
    margins.map((m) => m.margin).filter((m) => m !== null),
  ) ?? [null, 0];
  /* A margin is the file's only when more than half the screens use it. */
  const clear = commonCount > found.length / 2;
  const margin = clear ? common : null;
  const outliers = clear
    ? margins.filter((m) => m.margin !== null && m.margin !== margin)
    : [];

  const counts = new Map();
  for (const v of found.flatMap((s) => s.spacing))
    counts.set(v, (counts.get(v) ?? 0) + 1);
  const steps = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([value, n]) => ({ value, count: n }))
    .sort((a, b) => a.value - b.value);

  const rows = perScreen(found, 'rows', (r) => `${r.count}|${r.gap}`).map(
    ({ a, b, screens: n }) => ({ count: a, gap: b, screens: n }),
  );
  const scrollRows = perScreen(
    found,
    'scrollRows',
    (r) => `${r.start}|${r.gap}`,
  ).map(({ a, b, screens: n }) => ({ start: a, gap: b, screens: n }));

  const offGrid = [
    ...new Set([
      ...margins.map((m) => m.margin),
      ...steps.map((s) => s.value),
      ...rows.map((r) => r.gap),
      ...scrollRows.map((r) => r.gap),
    ]),
  ]
    .filter((v) => v !== null && !PAGE_STEPS.includes(v))
    .sort((a, b) => a - b)
    .map((value) => ({ value, nearest: nearestSteps(value) }));

  /* Layout grids the designer set up, each against its own screen's content. */
  const designed = found.flatMap((s) =>
    s.grids
      .filter((g) => g.pattern === 'COLUMNS')
      .map((g) => ({ screen: s.name, screenMargin: s.margin, ...g })),
  );
  const ignoredGrids = designed.filter(
    (g) =>
      g.screenMargin !== null &&
      g.offset !== undefined &&
      g.offset !== g.screenMargin,
  );

  return {
    screens: found.length,
    margin,
    marginCount: clear ? commonCount : 0,
    margins,
    outliers,
    steps,
    rows,
    scrollRows,
    offGrid,
    designedGrids: designed,
    ignoredGrids,
    perScreen: found,
  };
}

export function surveyLines(result) {
  const lines = [];
  const known = result.margins.filter((m) => m.margin !== null);
  lines.push(
    result.margin !== null
      ? `Side margin: ${result.margin} on ${result.marginCount} of ${result.screens} screens.`
      : known.length
        ? `Side margin: no clear one (no value on more than half the screens): ${known.map((m) => `${m.name} ${m.margin}`).join(', ')}. Ask which is meant.`
        : 'Side margin: none found (every layer spans the screen, or the screens are empty).',
  );
  for (const o of result.outliers)
    lines.push(`  ! "${o.name}" uses ${o.margin}: on purpose, or a slip?`);
  lines.push(
    result.steps.length
      ? `Spacing that repeats: ${result.steps.map((s) => `${s.value} (×${s.count})`).join(', ')}.`
      : 'Spacing that repeats: none found.',
  );
  for (const r of result.rows)
    lines.push(
      `Rows: ${r.count} per row with a ${r.gap} gap, on ${r.screens} screen(s).`,
    );
  for (const r of result.scrollRows)
    lines.push(
      `Rows that scroll sideways: starting ${r.start} in from the left, ${r.gap} gap, on ${r.screens} screen(s). The margin is on the left only; build them as a scrolling row.`,
    );
  if (result.designedGrids.length)
    lines.push(
      `Layout grids set up in Figma: ${result.designedGrids.map((g) => `${g.count} columns, gutter ${g.gutter}, margin ${g.offset} (${g.screen})`).join('; ')}.`,
    );
  for (const g of result.ignoredGrids)
    lines.push(
      `  ! "${g.screen}" has a layout grid with a ${g.offset} margin, but its own content sits at ${g.screenMargin}.`,
    );
  for (const v of result.offGrid)
    lines.push(
      `  ~ ${v.value} isn't a page step; nearest ${v.nearest.join(' or ')}. Snap it, or make it a proper value. A snapped gap moves everything below it.`,
    );
  return lines;
}

/* The figma.json `grid` entry for a confirmed survey. */
export function gridEntry(result) {
  const top = result.rows[0];
  const scroll = result.scrollRows[0];
  return {
    margin: result.margin,
    spacing: result.steps.map((s) => s.value),
    ...(top ? { columns: top.count, gutter: top.gap } : {}),
    ...(scroll ? { scrollRow: { start: scroll.start, gap: scroll.gap } } : {}),
    screens: result.screens,
  };
}

/* Library components a screen uses: instances at the screen level, not the ones inside other components. */
export function piecesOf(tree) {
  const counts = new Map();
  for (const { node, insideInstance } of placed(tree)) {
    if (insideInstance || node.type !== 'INSTANCE' || !node.component) continue;
    const name = node.component.name;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

/*
 * Pieces check. map.pieces:
 *   { use, selector }  ours, and how to count it on the page
 *   { new: "why" }     not in the library yet: port it first (not done)
 *   { skip: "why" }    left out, for a reason that names a real limit
 * pageCounts: { "<selector>": number found on the built page }.
 */
export function checkPieces(pieces, mapPieces = {}, pageCounts = {}, exported) {
  const rows = [];
  for (const [name, count] of pieces) {
    const entry = mapPieces[name];
    if (!entry) {
      rows.push({
        name,
        figma: count,
        status: 'UNMAPPED',
        note: 'add it to the map: which library component, new, or why it is skipped',
      });
      continue;
    }
    if (entry.new) {
      rows.push({
        name,
        figma: count,
        status: 'NEW',
        note: `not in the library yet; port it first (${entry.new})`,
      });
      continue;
    }
    if (entry.skip) {
      rows.push(
        NOT_A_REASON.test(entry.skip)
          ? {
              name,
              figma: count,
              status: 'FAIL',
              note: `"${entry.skip}" isn't a reason to skip: a missing component is "new"; a skip names what makes it impossible`,
            }
          : { name, figma: count, status: 'SKIP', note: entry.skip },
      );
      continue;
    }
    if (exported && entry.use && !exported.has(entry.use)) {
      rows.push({
        name,
        figma: count,
        status: 'FAIL',
        note: `${entry.use} isn't in the library`,
      });
      continue;
    }
    const code = entry.selector ? (pageCounts[entry.selector] ?? 0) : null;
    const ok = code === null || code >= count;
    rows.push({
      name,
      figma: count,
      code,
      use: entry.use,
      status: ok ? 'PASS' : 'FAIL',
      note: ok
        ? ''
        : `${count} in Figma, ${code} on the page (${entry.selector}): built with something else?`,
    });
  }
  return rows;
}

/*
 * A layer's box on the screen, from a path as `--layers` prints it (with or
 * without "root/"). Siblings sharing a name are numbered `#2`, `#3`, as in
 * every other map.
 */
export function boxAt(tree, layerPath) {
  const want = layerPath.startsWith('root') ? layerPath : `root/${layerPath}`;
  let found = null;
  const visit = (node, here, ax, ay) => {
    if (here === want) {
      found = { x: ax, y: ay, w: node.w, h: node.h };
      return;
    }
    const seen = new Map();
    for (const child of node.children ?? []) {
      const n = (seen.get(child.name) ?? 0) + 1;
      seen.set(child.name, n);
      const p = `${here}/${child.name}${n > 1 ? `#${n}` : ''}`;
      if (want === p || want.startsWith(`${p}/`))
        visit(child, p, ax + (child.x ?? 0), ay + (child.y ?? 0));
    }
  };
  visit(tree, 'root', 0, 0);
  return found;
}

/*
 * Regions check: each region's left edge and width against the frame, and its
 * gap to the region above it, within the 8px grid. Measuring every region
 * from the top of the page would fail everything below one snapped gap. The
 * first region, and any marked `pinned` (a bar fixed to the screen), are
 * checked from the top instead. Heights only fail when marked `fixedHeight`:
 * content decides most heights.
 */
export function checkRegions(
  tree,
  mapRegions = {},
  pageBoxes = {},
  tolerance = 8,
) {
  const entries = Object.entries(mapRegions).map(([layer, entry]) => ({
    layer,
    selector: typeof entry === 'string' ? entry : entry.selector,
    fixedHeight: typeof entry === 'object' && !!entry.fixedHeight,
    pinned: typeof entry === 'object' && !!entry.pinned,
    figma: boxAt(tree, layer),
  }));
  for (const e of entries) e.code = pageBoxes[e.selector];
  const flowing = entries
    .filter((e) => e.figma && e.code && !e.pinned)
    .sort((a, b) => a.figma.y - b.figma.y);

  return entries.map((e) => {
    const { layer, selector, figma, code } = e;
    if (!figma)
      return {
        layer,
        selector,
        status: 'FAIL',
        note: 'no layer at that path; check --layers',
      };
    if (!code)
      return {
        layer,
        selector,
        status: 'FAIL',
        note: 'nothing on the page matches the selector',
      };
    const d = {
      x: round(code.x - figma.x),
      w: round(code.w - figma.w),
      h: round(code.h - figma.h),
    };
    const notes = ['x', 'w', ...(e.fixedHeight ? ['h'] : [])]
      .filter((k) => Math.abs(d[k]) > tolerance)
      .map((k) => `${k} off by ${d[k]}`);

    const i = flowing.indexOf(e);
    const above = i > 0 ? flowing[i - 1] : null;
    if (above) {
      /* Bottom of the region above to the top of this one; top to top when they overlap. */
      const stacked = above.figma.y + above.figma.h <= figma.y + 1;
      const figmaGap = stacked
        ? figma.y - (above.figma.y + above.figma.h)
        : figma.y - above.figma.y;
      const codeGap = stacked
        ? code.y - (above.code.y + above.code.h)
        : code.y - above.code.y;
      d.gap = round(codeGap - figmaGap);
      if (Math.abs(d.gap) > tolerance)
        notes.push(`gap below ${above.layer} off by ${d.gap}`);
    } else {
      d.y = round(code.y - figma.y);
      if (Math.abs(d.y) > tolerance) notes.push(`y off by ${d.y}`);
    }
    const failed = notes.length > 0;
    if (!failed && Math.abs(d.h) > tolerance)
      notes.push(`height differs by ${d.h} (content decides it)`);
    return {
      layer,
      selector,
      figma,
      code,
      delta: d,
      status: failed ? 'FAIL' : 'PASS',
      note: notes.join(', '),
    };
  });
}

/* The phone widths a screen is checked at: small, the frame's own, large. */
export function widthsFor(frameWidth) {
  if (frameWidth >= 768) return [round(frameWidth)];
  return [...new Set([320, round(frameWidth), 430])].sort((a, b) => a - b);
}

/* Sizes in the frame big enough that copying them into code fixes a layout. */
export function layerSizes(tree, min = 120) {
  const sizes = new Set();
  const ratios = new Set();
  for (const { node, depth } of placed(tree)) {
    if (depth === 0) continue;
    for (const v of [node.w, node.h]) if (v >= min) sizes.add(round(v));
    if (node.w >= 40 && node.h >= 40)
      ratios.add(`${round(node.w)}/${round(node.h)}`);
  }
  return { sizes, ratios };
}

/*
 * Sizes copied from the frame into code: the frame's width or height, a
 * Tailwind width or height whose pixels (step × 4) equal a layer's size, an
 * aspect ratio that is a layer's exact width/height, or a full-screen height
 * where the page should grow and scroll.
 */
export function fixedSizes(source, { w, h }, { sizes, ratios } = {}) {
  const hits = [];
  const W = round(w);
  const H = round(h);
  const patterns = [
    [
      new RegExp(`\\b${W}px\\b|[wW]-\\[${W}`),
      `the frame's width (${W}) as a fixed width; let it fill instead`,
    ],
    [
      new RegExp(`\\b${H}px\\b|h-\\[${H}`),
      `the frame's height (${H}) as a fixed height; let content decide`,
    ],
    [
      /\bh-screen\b|\b100vh\b/,
      'a full-screen height in vh; use the dynamic viewport (h-dvh / 100dvh) only for true full-screen layouts',
    ],
  ];
  const STEP =
    /(?:^|[\s"'`:])(?:min-|max-)?(w|h|size)-(\d+(?:\.\d+)?)(?=[\s"'`]|$)/g;
  const ASPECT = /aspect-\[(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\]/g;
  source.split('\n').forEach((line, i) => {
    const hit = (note) => hits.push({ line: i + 1, text: line.trim(), note });
    for (const [pattern, note] of patterns) if (pattern.test(line)) hit(note);
    if (sizes)
      for (const [, prop, step] of line.matchAll(STEP)) {
        const px = Number(step) * 4;
        if (sizes.has(round(px)))
          hit(
            `${prop}-${step} is ${px}px, a size from the frame; let it fill or hug, maybe with a max width`,
          );
      }
    if (ratios)
      for (const [, a, b] of line.matchAll(ASPECT))
        if (ratios.has(`${round(Number(a))}/${round(Number(b))}`))
          hit(
            `aspect-[${a}/${b}] is a layer's exact size from the frame; use a plain ratio (3/4, 16/9) or let the picture decide`,
          );
  });
  return hits;
}

const words = (text) =>
  String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
const solid = (fill) =>
  (Array.isArray(fill) ? fill : [fill]).find((p) => p && p.hex) ?? null;

/*
 * Every text in the frame, once per wording: what the page is looked up by,
 * with the face, size, weight and colour it should have. Two-colour text
 * comes as runs, each checked on its own.
 */
export function textsOf(tree) {
  const out = new Map();
  for (const { node } of placed(tree)) {
    if (!node.text) continue;
    const chars = words(node.text.chars);
    if (chars.length < 2 || out.has(chars)) continue;
    const parts = node.text.runs?.length
      ? node.text.runs.map((r) => ({
          chars: words(r.chars),
          family: r.family,
          size: r.size,
          weight: r.weight,
          hex: r.hex,
        }))
      : [
          {
            chars,
            family: node.text.family,
            size: node.text.size,
            weight: node.text.weight,
            hex: solid(node.fill)?.hex,
          },
        ];
    out.set(chars, { layer: node.name, chars, parts });
  }
  return [...out.values()];
}

/*
 * Text check. `found` is what the page shows for each part, keyed by its
 * words: { family, size, weight, color } from the element holding them, or
 * missing when the words aren't on the page (story copy differs, or it was
 * left out). Missing is a note, not a failure: wording is the story's call.
 */
export function checkTexts(texts, found = {}) {
  const rows = [];
  for (const t of texts)
    for (const part of t.parts) {
      const got = found[part.chars];
      const label =
        part.chars.length > 32 ? `${part.chars.slice(0, 31)}…` : part.chars;
      if (!got) {
        rows.push({
          layer: t.layer,
          text: label,
          status: 'MISSING',
          note: 'these words are not on the page',
        });
        continue;
      }
      const notes = [];
      const family = String(got.family ?? '')
        .split(',')[0]
        .replace(/["']/g, '')
        .trim()
        .toLowerCase();
      const want = String(part.family ?? '').toLowerCase();
      if (want && !family.includes(want) && !want.includes(family))
        notes.push(`face ${got.family.split(',')[0]}, Figma ${part.family}`);
      if (typeof part.size === 'number' && Math.abs(got.size - part.size) > 0.5)
        notes.push(`size ${got.size}, Figma ${part.size}`);
      if (typeof part.weight === 'number' && Number(got.weight) !== part.weight)
        notes.push(`weight ${got.weight}, Figma ${part.weight}`);
      if (
        part.hex &&
        got.color &&
        !sameColor(toRgb(got.color) ?? got.color, part.hex)
      )
        notes.push(
          `colour ${toRgb(got.color) ?? got.color}, Figma ${part.hex}`,
        );
      rows.push({
        layer: t.layer,
        text: label,
        status: notes.length ? 'FAIL' : 'PASS',
        note: notes.join(', '),
      });
    }
  return rows;
}

/* The mode a frame is drawn in: what the map says, else dark when its background is. */
export function drawnMode(tree, map = {}) {
  if (map.drawnIn) return map.drawnIn;
  const hex = solid(tree.fill)?.hex;
  const rgb = hex ? toRgb(hex) : null;
  const m = rgb && /(\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  if (!m) return 'light';
  const [r, g, b] = m.slice(1).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128 ? 'dark' : 'light';
}
