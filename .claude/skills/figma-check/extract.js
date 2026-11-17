/*
 * The extractor: one run, one snapshot of a Figma component or frame.
 *
 * Paste it into `figma_execute` (the Desktop Bridge plugin must be running),
 * after a line naming the target:
 *
 *   const SPEC = {
 *     slug: 'button',              // becomes packages/ui/figma/specs/button.json
 *     nodes: ['123:456'],          // frames or instances you are building, optional
 *     set: '123:400',              // a component set for the variant layer, optional
 *   };
 *   <this file>
 *
 * Never hand-write a walker instead: a property you forget to read looks
 * absent rather than unchecked, and that is how a border, a text case or a fill
 * goes missing for a whole port.
 *
 * What it captures that the design-system exports don't: variables as names,
 * text case, the text style name, gradients with their stops, trees that go
 * through instances, and defaults left out so a snapshot stays small. Variants
 * are stored as differences from the default variant.
 */

const SCHEMA_VERSION = 5;
const TOKENS = new Map(); // name -> byMode
const VARIABLES = new Map(); // name -> { collection, remote }

/* Warnings are grouped by kind, so a screen with a hundred unstyled text
 * layers asks for one decision, not a hundred. Each keeps the node ids it came
 * from, so the audit only shows the ones inside the tree it checks. */
const WARNINGS = new Map(); // kind -> { kind, message, count, ids, paths }
function warn(kind, node, where, message) {
  const w = WARNINGS.get(kind) || { kind, message, count: 0, ids: [], paths: [] };
  w.count += 1;
  if (node && node.id && !w.ids.includes(node.id)) w.ids.push(node.id);
  if (where && w.paths.length < 5 && !w.paths.includes(where)) w.paths.push(where);
  WARNINGS.set(kind, w);
}

/* ---------------------------------------------------------------- helpers */

/* figma.mixed is a symbol: touching it in a template string throws and kills
 * the whole run, so every read that can return it is guarded. */
const safe = (fn, fallback = null) => {
  try {
    const v = fn();
    return typeof v === 'symbol' ? 'MIXED' : v;
  } catch {
    return fallback;
  }
};
const num = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : null);
const hex = (c) =>
  '#' +
  ['r', 'g', 'b']
    .map((k) =>
      Math.round(c[k] * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');
/*
 * Always use this for a paint or effect colour. `hex()` alone drops the alpha
 * channel, which is how an `INNER_SHADOW` at `rgba(0,0,0,0.15)` was recorded
 * as `#000000` and shipped as an opaque black bar. Absent is not default.
 */
const colour = (c, extraOpacity) => {
  const a = (typeof c.a === 'number' ? c.a : 1) * (extraOpacity ?? 1);
  if (a === 1) return hex(c);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${Math.round(a * 1000) / 1000})`;
};

/* Every Figma blend but Linear burn has a `mix-blend-mode`. The CSS name is
 * stored with it; only Linear burn needs an approximation someone decides. */
const NORMAL_BLENDS = new Set(['NORMAL', 'PASS_THROUGH', undefined, null]);
const CSS_BLENDS = {
  LINEAR_DODGE: 'plus-lighter',
  COLOR_DODGE: 'color-dodge',
  COLOR_BURN: 'color-burn',
  HARD_LIGHT: 'hard-light',
  SOFT_LIGHT: 'soft-light',
};
const cssBlend = (blend) =>
  blend === 'LINEAR_BURN'
    ? null
    : CSS_BLENDS[blend] || String(blend).toLowerCase().replace(/_/g, '-');
function noteBlend(blend, node, where) {
  if (NORMAL_BLENDS.has(blend)) return null;
  const css = cssBlend(blend);
  if (!css)
    warn('blend-linear-burn', node, where, 'Linear burn has no CSS blend: approximate it and record the decision in FIGMA.md.');
  else
    warn(`blend-${css}`, node, where, `blend mode: use mix-blend-mode: ${css}, and check it over what is really painted behind it.`);
  return { figma: blend, css };
}

/* Resolve a variable to its value in every mode of its own collection, so the
 * spec can be asserted against our light and dark token pairs at once. */
async function resolveVariable(id, depth = 0) {
  if (depth > 6) return null;
  let v;
  try {
    v = await figma.variables.getVariableByIdAsync(id);
  } catch {
    return null;
  }
  if (!v) return null;
  const remote = Boolean(v.remote);
  let collection;
  try {
    collection =
      await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
  } catch {
    collection = null;
  }
  const byMode = {};
  for (const mode of (collection && collection.modes) || []) {
    let raw = v.valuesByMode[mode.modeId];
    if (raw && raw.type === 'VARIABLE_ALIAS') {
      const target = await resolveVariable(raw.id, depth + 1);
      byMode[mode.name] =
        target && target.byMode
          ? (target.byMode[mode.name] ?? Object.values(target.byMode)[0] ?? null)
          : null;
      continue;
    }
    if (raw && typeof raw === 'object' && 'r' in raw) {
      byMode[mode.name] =
        typeof raw.a === 'number' && raw.a !== 1
          ? `rgba(${Math.round(raw.r * 255)},${Math.round(raw.g * 255)},${Math.round(raw.b * 255)},${num(raw.a)})`
          : hex(raw);
      continue;
    }
    byMode[mode.name] = typeof raw === 'number' ? num(raw) : (raw ?? null);
  }
  return { name: v.name, byMode, collection: collection ? collection.name : null, remote };
}

const VAR_NAMES = new Map();
async function varName(alias) {
  if (!alias || !alias.id) return null;
  if (VAR_NAMES.has(alias.id)) return VAR_NAMES.get(alias.id);
  const resolved = await resolveVariable(alias.id);
  const name = resolved ? resolved.name : null;
  VAR_NAMES.set(alias.id, name);
  if (name && !TOKENS.has(name)) {
    TOKENS.set(name, resolved.byMode);
    VARIABLES.set(name, { collection: resolved.collection, remote: resolved.remote });
  }
  return name;
}

async function paint(p, node, where) {
  if (!p || p.visible === false) return null;
  const token = await varName(p.boundVariables && p.boundVariables.color);
  const o = {};
  if (token) o.token = token;
  /* A solid's paint opacity is folded into its colour, so it's stored once. */
  if (p.type === 'SOLID') {
    o.hex = colour(p.color, p.opacity);
  } else {
    o.type = p.type;
    if (String(p.type).startsWith('GRADIENT')) {
      /*
       * The design-system export drops these, but the plugin API carries both
       * stops and transform — so a gradient IS portable, and treating it as a
       * warning had components shipping hand-rolled approximations of fills
       * that were readable all along.
       *
       * The transform maps object space to gradient space: invert its linear
       * part for the axis, scale by the node's width and height, and
       * `atan2(x, -y)` is the CSS angle. For a radial, the inverse applied to
       * the centre gives its position and to the unit vectors its radii.
       */
      o.stops = (p.gradientStops || []).map((st) => ({
        pos: Math.round(st.position * 10000) / 10000,
        color: colour(st.color),
      }));
      o.transform = p.gradientTransform;
    }
    if (p.type === 'IMAGE') {
      o.imageHash = p.imageHash;
      o.scaleMode = p.scaleMode;
      /*
       * How the designer slid and zoomed the picture inside its box. Without
       * it a cropped photo comes out framed differently in code.
       */
      if (p.scaleMode === 'CROP' && p.imageTransform) o.crop = p.imageTransform;
      if (p.scaleMode === 'TILE' && p.scalingFactor) o.tileScale = num(p.scalingFactor);
      if (p.rotation) o.rotation = p.rotation;
      warn('image', node, where, 'image fill: export it (figma-check reference.md, "Pictures out of Figma"); never fake it.');
    }
    if (p.type === 'VIDEO') {
      o.videoHash = p.videoHash || null;
      warn('video', node, where, 'video fill: motion the designer could not draw. Ask for the file, or propose the motion.');
    }
    if (typeof p.opacity === 'number' && p.opacity !== 1) o.opacity = num(p.opacity);
  }
  const blend = noteBlend(p.blendMode, node, where);
  if (blend) o.blend = blend.css || blend.figma;
  return o;
}

function radius(n) {
  const uniform = safe(() => n.cornerRadius);
  if (typeof uniform === 'number') return uniform || undefined;
  if (uniform !== 'MIXED') return undefined;
  return [
    num(n.topLeftRadius),
    num(n.topRightRadius),
    num(n.bottomRightRadius),
    num(n.bottomLeftRadius),
  ].join('/');
}

/* Several ports have gone wrong on exactly these fields, so all are captured. */
async function textOf(n, where) {
  const t = {
    chars: String(n.characters).slice(0, 80),
    size: safe(() => n.fontSize),
    weight: safe(() => n.fontWeight),
    family: safe(() => (n.fontName && n.fontName.family) || null),
    lineHeight: safe(() => {
      const lh = n.lineHeight;
      if (!lh || !lh.unit) return null;
      return lh.unit === 'AUTO' ? 'AUTO' : num(lh.value) + (lh.unit === 'PERCENT' ? '%' : 'px');
    }),
    letterSpacing: safe(() => {
      const ls = n.letterSpacing;
      if (!ls || !ls.unit) return null;
      return num(ls.value) + (ls.unit === 'PERCENT' ? '%' : 'px');
    }),
    case: safe(() => n.textCase),
    decoration: safe(() => n.textDecoration),
    align: safe(() => n.textAlignHorizontal),
    /* Cap-height trim: CSS `text-box: trim-both cap alphabetic`. */
    trim: safe(() => n.leadingTrim),
  };
  const styleId = safe(() => n.textStyleId);
  if (styleId && styleId !== 'MIXED') {
    try {
      const st = await figma.getStyleByIdAsync(styleId);
      if (st) t.style = st.name;
    } catch {
      /* remote style, unresolvable */
    }
  }
  const bound = safe(() => n.boundVariables && n.boundVariables.fontSize);
  if (bound && bound[0]) t.sizeToken = await varName(bound[0]);
  if (!t.style && !t.sizeToken) {
    warn('text-style', n, where, 'text with no text style or size token: off-system in the source, so it needs a documented snap.');
  }
  /*
   * Text in two colours, sizes or faces reads as "MIXED" on the layer. Each run
   * is recorded, or the second colour is lost.
   */
  const mixed = ['fills', 'fontSize', 'fontWeight', 'fontName'].some(
    (k) => safe(() => n[k]) === 'MIXED',
  );
  if (mixed && typeof n.getStyledTextSegments === 'function') {
    const segments = safe(
      () => n.getStyledTextSegments(['fills', 'fontSize', 'fontWeight', 'fontName']),
      [],
    );
    t.runs = [];
    for (const seg of segments || []) {
      const fill = Array.isArray(seg.fills) ? await paint(seg.fills[0], n, where) : null;
      t.runs.push({
        chars: String(seg.characters).slice(0, 40),
        ...(fill && fill.hex ? { hex: fill.hex } : {}),
        ...(fill && fill.token ? { token: fill.token } : {}),
        size: seg.fontSize,
        weight: seg.fontWeight,
        family: seg.fontName && seg.fontName.family,
      });
    }
    for (const k of ['size', 'weight', 'family'])
      if (t[k] === 'MIXED') delete t[k];
  }
  if (t.case === 'ORIGINAL') delete t.case;
  if (t.decoration === 'NONE') delete t.decoration;
  if (t.align === 'LEFT') delete t.align;
  if (!t.trim || t.trim === 'NONE') delete t.trim;
  else warn('leading-trim', n, where, 'text trimmed to cap height: use `text-box: trim-both cap alphabetic`.');
  return t;
}

/* ------------------------------------------------------------------- walk */

async function walk(node, parent, path) {
  const here = path ? `${path}/${node.name}` : String(node.name);
  const b = node.absoluteBoundingBox;
  const o = {
    id: node.id,
    name: String(node.name).slice(0, 48),
    type: node.type,
    w: num(node.width),
    h: num(node.height),
  };
  if (b && parent && parent.absoluteBoundingBox) {
    o.x = num(b.x - parent.absoluteBoundingBox.x);
    o.y = num(b.y - parent.absoluteBoundingBox.y);
  }
  /* What it draws, shadows and glows included. An export is this size, not
   * the box's: a 28×40 icon with a shadow exports at 39×50. */
  const rb = safe(() => node.absoluteRenderBounds);
  if (b && rb && (Math.abs(rb.width - b.width) > 0.5 || Math.abs(rb.height - b.height) > 0.5)) {
    o.drawn = { w: num(rb.width), h: num(rb.height), dx: num(rb.x - b.x), dy: num(rb.y - b.y) };
  }

  if (node.layoutMode && node.layoutMode !== 'NONE') {
    o.layout = {
      dir: node.layoutMode,
      gap: num(node.itemSpacing),
      pad: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft]
        .map(num)
        .join(','),
      main: safe(() => node.primaryAxisAlignItems),
      cross: safe(() => node.counterAxisAlignItems),
    };
    const wrap = safe(() => node.layoutWrap);
    if (wrap && wrap !== 'NO_WRAP') o.layout.wrap = wrap;
    const gapToken = safe(() => node.boundVariables && node.boundVariables.itemSpacing);
    if (gapToken) o.layout.gapToken = await varName(gapToken);
  }
  /* HUG / FILL / FIXED. Stated in the file and routinely guessed in code —
   * this is what decides flex-1 versus shrink-0. */
  const sizing = [
    safe(() => node.layoutSizingHorizontal),
    safe(() => node.layoutSizingVertical),
  ].join('/');
  if (sizing !== 'null/null') o.sizing = sizing;

  const fills = safe(() => node.fills, null);
  if (Array.isArray(fills)) {
    const out = [];
    for (const f of fills) {
      const p = await paint(f, node, here);
      if (p) out.push(p);
    }
    if (out.length) o.fill = out.length === 1 ? out[0] : out;
  } else if (fills === 'MIXED') o.fill = 'MIXED';

  const strokes = safe(() => node.strokes, null);
  if (Array.isArray(strokes) && strokes.length) {
    const out = [];
    for (const st of strokes) {
      const p = await paint(st, node, here);
      if (p) out.push(p);
    }
    if (out.length) {
      o.stroke = out.length === 1 ? out[0] : out;
      const weight = safe(() => node.strokeWeight);
      if (weight === 'MIXED') {
        o.strokeWeights = [
          node.strokeTopWeight,
          node.strokeRightWeight,
          node.strokeBottomWeight,
          node.strokeLeftWeight,
        ]
          .map(num)
          .join(',');
      } else o.strokeWeight = weight;
      o.strokeAlign = safe(() => node.strokeAlign);
    }
  }

  const r = radius(node);
  if (r !== undefined) o.radius = r;

  const fx = safe(() => node.effects, null);
  if (Array.isArray(fx) && fx.length) {
    const effects = [];
    for (const e of fx) {
      if (e.visible === false) continue;
      const blend = noteBlend(e.blendMode, node, here);
      const effect = {
        type: e.type,
        radius: num(e.radius),
        spread: num(e.spread),
        offset: e.offset ? `${num(e.offset.x)},${num(e.offset.y)}` : null,
        color: e.color ? colour(e.color) : null,
        blend: blend ? blend.css || blend.figma : undefined,
        token: await varName(e.boundVariables && e.boundVariables.color),
      };
      if (e.type === 'GLASS') {
        /* Kept whole, so the audit can check the rebuilt glass against it. */
        for (const k of ['lightIntensity', 'lightAngle', 'refraction', 'depth', 'dispersion', 'frost']) {
          const v = safe(() => e[k]);
          if (typeof v === 'number') effect[k] = num(v);
        }
        warn('glass', node, here, "Figma's glass: build it with the glass recipe in reference.md (blur, lit rim, inner light).");
      }
      effects.push(effect);
    }
    if (effects.length) o.effects = effects;
  }

  const op = safe(() => node.opacity);
  if (typeof op === 'number' && op !== 1) o.opacity = num(op);
  if (node.clipsContent === true) o.clips = true;
  /* Absolutely placed children sit outside the auto-layout order. */
  if (safe(() => node.layoutPositioning) === 'ABSOLUTE') o.absolute = true;
  /* How a layer placed by hand is pinned when its frame resizes: "left and
   * right" says it fills, "centre" that it stays centred. Only meaningful
   * where the parent has no auto-layout. */
  const parentLayout = parent && safe(() => parent.layoutMode);
  if (!parentLayout || parentLayout === 'NONE') {
    const c = safe(() => node.constraints);
    if (c && c.horizontal) o.constraints = `${c.horizontal}/${c.vertical}`;
  }
  /* Which library component an instance comes from, so a screen's pieces can
   * be matched to ours by name. */
  if (node.type === 'INSTANCE') {
    const main = await node.getMainComponentAsync().catch(() => null);
    if (main) {
      const set = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : null;
      o.component = { name: String(set ? set.name : main.name), remote: !!main.remote };
      const props = safe(() => node.componentProperties, null);
      if (props) {
        const values = {};
        for (const [k, v] of Object.entries(props)) values[k.split('#')[0]] = v.value;
        o.component.props = values;
      }
    }
  }
  /* Layout grids the designer set up, on frames only. */
  const grids = safe(() => node.layoutGrids, null);
  if (Array.isArray(grids) && grids.length) {
    o.grids = grids
      .filter((g) => g.visible !== false)
      .map((g) => ({
        pattern: g.pattern,
        count: g.count,
        gutter: num(g.gutterSize),
        offset: num(g.offset),
        align: g.alignment,
        size: g.sectionSize === undefined ? undefined : num(g.sectionSize),
      }));
  }
  if (node.type === 'TEXT') {
    const resize = safe(() => node.textAutoResize);
    if (resize) o.textResize = resize;
  }
  if (node.type === 'TEXT') o.text = await textOf(node, here);

  /* Go through instances: stopping at them loses every text layer inside. */
  if ('children' in node) {
    const kids = [];
    for (const c of node.children) {
      /* Hidden nodes are excluded deliberately: an invisible variant is not
       * part of the design, and including them is how a hidden subtree gets
       * ported by mistake. */
      if (c.visible === false) continue;
      kids.push(await walk(c, node, here));
    }
    if (kids.length) o.children = kids;
  }
  return o;
}

/* ---------------------------------------------------------- variant layer */

/* Flatten a tree to `path -> comparable properties`, so variants can be
 * diffed against each other rather than read one at a time. */
/* Rooted at a constant, never at the node's own name: a variant is named
 * `Size=Medium, Variant=Outline, …`, so rooting there gives every variant a
 * different set of paths and every diff becomes "whole tree replaced".
 * Siblings sharing a name are numbered `#2`, `#3`, as the parity check does. */
function signature(node, out = {}, here = 'root') {
  const { children, id, name, ...rest } = node;
  /* Where a variant sits on the canvas isn't a design difference. */
  if (here === 'root') {
    delete rest.x;
    delete rest.y;
  }
  out[here] = JSON.parse(JSON.stringify(rest));
  const seen = new Map();
  for (const c of children || []) {
    const n = (seen.get(c.name) || 0) + 1;
    seen.set(c.name, n);
    signature(c, out, `${here}/${c.name}${n > 1 ? `#${n}` : ''}`);
  }
  return out;
}

function diffSignatures(base, other) {
  const changes = [];
  const paths = new Set([...Object.keys(base), ...Object.keys(other)]);
  for (const p of paths) {
    const a = base[p];
    const b = other[p];
    if (!a) {
      /* A node this variant ADDS. Recording only "present" loses everything
       * about it, so a variant that swaps in a whole subtree reconstructs as
       * empty — the properties have to travel with the addition. */
      changes.push({ path: p, prop: '(node)', from: null, to: 'present' });
      for (const [k, v] of Object.entries(b)) {
        changes.push({ path: p, prop: k, from: null, to: v });
      }
      continue;
    }
    if (!b) {
      changes.push({ path: p, prop: '(node)', from: 'present', to: null });
      continue;
    }
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const av = JSON.stringify(a[k] ?? null);
      const bv = JSON.stringify(b[k] ?? null);
      if (av !== bv) changes.push({ path: p, prop: k, from: a[k] ?? null, to: b[k] ?? null });
    }
  }
  return changes;
}

const STATE_RE =
  /^(default|hover|hovered|press(ed)?|active|focus(ed)?|disabled|error|loading|selected|checked|open|closed)$/i;
/*
 * A True/False axis says nothing on its own: `Selected` is a state, `Inverted`
 * and `Dashed` are styling props, and both carry the same values. So a boolean
 * axis is classified by its name, and only a value-named axis by its values.
 */
const STATE_NAME_RE =
  /^(selected|checked|disabled|loading|pressed|active|focused?|open|expanded|error|invalid|partial|indeterminate)$/i;
/*
 * Two values that read as off and on (Notify/Notified, Off/On, Follow/Following)
 * are a pressed state, whatever the axis is called — often just "Property 1".
 */
function isOnOffPair(values) {
  if (values.length !== 2) return false;
  const [a, b] = values.map((v) => String(v).trim().toLowerCase());
  const pair = (x, y) =>
    (x === 'off' && y === 'on') ||
    (x === 'inactive' && y === 'active') ||
    (x === `un${y}`) ||
    y === `${x}ed` ||
    y === x.replace(/y$/, 'ied') ||
    y === `${x}d` ||
    y === `${x}ing` ||
    y === `${x.replace(/e$/, '')}ing`;
  return pair(a, b) || pair(b, a);
}
const isStateAxis = (axis, values) =>
  values.every((v) => /^(true|false)$/i.test(String(v)))
    ? STATE_NAME_RE.test(axis)
    : values.every((v) => STATE_RE.test(String(v))) || isOnOffPair(values);

/* ------------------------------------------------------------------- main */

const spec = {
  _meta: {
    schemaVersion: SCHEMA_VERSION,
    slug: SPEC.slug,
    fileKey: figma.fileKey || null,
    fileName: figma.root.name,
    nodes: SPEC.nodes || [],
    set: SPEC.set || null,
    extractedAt: new Date().toISOString(),
    modes: {},
    figmaUrl: figma.fileKey
      ? `https://www.figma.com/design/${figma.fileKey}?node-id=${String(((SPEC.nodes && SPEC.nodes.length ? SPEC.nodes : [SPEC.set])[0]) || '').replace(':', '-')}`
      : null,
    extractor: 'figma-check/extract.js',
  },
  tokens: {},
  variables: {},
  warnings: [],
  sets: [],
  nodes: [],
};

for (const id of SPEC.nodes || []) {
  const node = await figma.getNodeByIdAsync(id);
  if (!node) {
    warn('not-found', null, id, 'a node named in SPEC was not found.');
    continue;
  }
  const tree = await walk(node, node.parent, '');
  spec.nodes.push({ id, name: node.name, tree });
  /* Which mode each variable collection is drawn in, so raw colours are only
   * compared in that mode. */
  const modes = safe(() => node.resolvedVariableModes, null) || {};
  for (const [collectionId, modeId] of Object.entries(modes)) {
    const collection = await figma.variables
      .getVariableCollectionByIdAsync(collectionId)
      .catch(() => null);
    const mode = collection && collection.modes.find((m) => m.modeId === modeId);
    if (collection && mode) spec._meta.modes[collection.name] = mode.name;
  }
}

if (SPEC.set) {
  const setNode = await figma.getNodeByIdAsync(SPEC.set);
  if (!setNode) warn('not-found', null, SPEC.set, 'a node named in SPEC was not found.');
  else {
    const variants = setNode.type === 'COMPONENT_SET' ? setNode.children : [setNode];
    const axes = {};
    for (const v of variants) {
      const props = safe(() => v.variantProperties, null) || {};
      for (const [k, val] of Object.entries(props)) {
        (axes[k] = axes[k] || new Set()).add(val);
      }
    }
    /* The set declares its own defaults; `children[0]` is whatever happens to
     * be first, often a hover variant nobody would diff against by choice. */
    let defs = null;
    try {
      defs = setNode.componentPropertyDefinitions;
    } catch {
      defs = null;
    }
    const defaults = {};
    for (const [k, d] of Object.entries(defs || {})) {
      if (d && d.type === 'VARIANT') defaults[k] = d.defaultValue;
    }
    const baseVariant =
      variants.find((v) => {
        const p = safe(() => v.variantProperties, null) || {};
        const keys = Object.keys(defaults);
        return keys.length > 0 && keys.every((k) => p[k] === defaults[k]);
      }) || variants[0];
    const baseTree = await walk(baseVariant, baseVariant.parent, '');
    const baseSig = signature(baseTree);

    const variantRecords = [];
    for (const v of variants) {
      const props = safe(() => v.variantProperties, null) || {};
      if (v.id === baseVariant.id) {
        variantRecords.push({ id: v.id, name: v.name, props, changes: [] });
        continue;
      }
      const sig = signature(await walk(v, v.parent, ''));
      variantRecords.push({
        id: v.id,
        name: v.name,
        props,
        changes: diffSignatures(baseSig, sig),
      });
    }

    /* Which properties each axis actually moves, and whether the axis is a
     * state (a CSS pseudo-class) or a real prop. */
    const axisDiffs = {};
    const axisClassification = {};
    const baseProps = safe(() => baseVariant.variantProperties, null) || {};
    for (const [axis, valuesSet] of Object.entries(axes)) {
      const values = [...valuesSet];
      const touched = new Set();
      for (const rec of variantRecords) {
        /* Only variants that differ from the base in this one axis say
         * anything about this axis. Unioning across all of them attributes
         * every change to every axis. */
        const moved = Object.keys(axes).filter((k) => rec.props[k] !== baseProps[k]);
        if (moved.length !== 1 || moved[0] !== axis) continue;
        for (const c of rec.changes) touched.add(`${c.path} · ${c.prop}`);
      }
      axisDiffs[axis] = [...touched].sort();
      axisClassification[axis] = {
        values,
        /* A state axis becomes pseudo-classes and data attributes, never a
         * prop (CLAUDE.md). */
        isState: isStateAxis(axis, values),
        onOff: isOnOffPair(values),
        movesLayout: axisDiffs[axis].some((t) => /· (w|h|layout|sizing|radius)$/.test(t)),
        colorOnly:
          axisDiffs[axis].length > 0 &&
          axisDiffs[axis].every((t) => /· (fill|stroke|effects)$/.test(t)),
      };
    }

    spec.sets.push({
      id: setNode.id,
      name: setNode.name,
      isComponentSet: setNode.type === 'COMPONENT_SET',
      axes: Object.fromEntries(Object.entries(axes).map(([k, v]) => [k, [...v]])),
      defaults,
      axisClassification,
      axisDiffs,
      baseVariant: { id: baseVariant.id, name: baseVariant.name, tree: baseTree },
      variants: variantRecords,
    });
  }
}


spec.tokens = Object.fromEntries([...TOKENS.entries()].sort());
spec.variables = Object.fromEntries([...VARIABLES.entries()].sort());
spec.warnings = [...WARNINGS.values()].sort((a, b) => b.count - a.count);
return spec;
