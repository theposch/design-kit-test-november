import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyVariant,
  compareNode,
  cssVarsFor,
  findSnapshot,
  flatten,
  hotRegions,
  normColor,
  orderRows,
  parseShadows,
  pickTree,
  positionRows,
  px,
  resolveEntries,
  sameColor,
  scaffoldMap,
  scopeWarnings,
  summarize,
  toRgb,
} from './lib.mjs';

const measured = (over = {}) => ({
  tag: 'div',
  x: 0,
  y: 0,
  w: 100,
  h: 40,
  padding: [0, 0, 0, 0],
  rowGap: 'normal',
  columnGap: 'normal',
  opacity: 1,
  backgroundColor: 'rgba(0, 0, 0, 0)',
  backgroundImage: 'none',
  borderWidths: [0, 0, 0, 0],
  borderColors: Array(4).fill('rgba(0, 0, 0, 0)'),
  radii: [0, 0, 0, 0],
  boxShadow: 'none',
  filter: 'none',
  backdropFilter: 'none',
  color: 'rgba(0, 0, 0, 1)',
  fontSize: 16,
  fontWeight: 400,
  lineHeight: '24px',
  letterSpacing: 'normal',
  textTransform: 'none',
  typeClasses: [],
  ...over,
});
const ctx = {
  tokenValues: {},
  textStyles: {},
  mode: 'light',
  drawnIn: 'light',
};
const statusOf = (rows, prop) => rows.find((r) => r.prop === prop)?.status;

test('siblings with the same name get their own paths', () => {
  const flat = flatten({
    name: 'Row',
    children: [{ name: 'Dot' }, { name: 'Dot' }, { name: 'Label' }],
  });
  assert.deepEqual(
    flat.map((f) => f.path),
    ['root', 'root/Dot', 'root/Dot#2', 'root/Label'],
  );
});

test('token names come from figma.json first, then the whole name, never a part', () => {
  assert.deepEqual(
    cssVarsFor('Content/Primary', { 'Content/Primary': '--foreground' }),
    ['--foreground'],
  );
  assert.deepEqual(cssVarsFor('text/primary'), ['--text-primary']);
});

test('colours compare across formats, within rounding', () => {
  assert.equal(normColor('#ff0000'), '255,0,0,1');
  assert.equal(normColor('rgba(0, 0, 0, 0)'), 'transparent');
  assert.ok(sameColor('#000000', 'rgba(1, 1, 1, 1)'));
  assert.ok(!sameColor('#000000', 'rgba(9, 9, 9, 1)'));
});

test('sizes read from px, percent and auto', () => {
  assert.equal(px('24px', 16), 24);
  assert.equal(px('150%', 16), 24);
  assert.equal(px('AUTO', 16), null);
  assert.equal(px('normal', 16), null);
});

test('unused shadow slots are ignored', () => {
  const shadows = parseShadows(
    'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px 0px',
  );
  assert.equal(shadows.length, 1);
  assert.deepEqual(
    { ...shadows[0], color: undefined },
    { inset: false, x: 0, y: 1, blur: 2, spread: 0, color: undefined },
  );
});

test('a token that is truly black still counts as found', () => {
  const rows = compareNode(
    'root',
    { type: 'FRAME', fill: { token: 'Fixed/Black', hex: '#000000' } },
    measured({ backgroundColor: 'rgba(0, 0, 0, 1)' }),
    { ...ctx, tokenValues: { 'Fixed/Black': 'rgba(0, 0, 0, 1)' } },
  );
  assert.equal(statusOf(rows, 'fill'), 'ok');
  assert.match(rows.find((r) => r.prop === 'fill').expected, /Fixed\/Black →/);
});

test('a text fill is checked against the text colour', () => {
  const node = { type: 'TEXT', fill: { hex: '#ff0000' }, text: { size: 16 } };
  assert.equal(
    statusOf(
      compareNode('t', node, measured({ color: 'rgba(255, 0, 0, 1)' }), ctx),
      'fill',
    ),
    'ok',
  );
  assert.equal(
    statusOf(
      compareNode('t', node, measured({ color: 'rgba(0, 0, 255, 1)' }), ctx),
      'fill',
    ),
    'FAIL',
  );
});

test('a raw colour is only checked in the mode it was drawn in', () => {
  const node = { type: 'FRAME', fill: { hex: '#ffffff' } };
  const rows = compareNode(
    'r',
    node,
    measured({ backgroundColor: 'rgba(0, 0, 0, 1)' }),
    { ...ctx, mode: 'dark' },
  );
  assert.equal(statusOf(rows, 'fill'), 'SKIP');
});

test('no fill means the design paints nothing there', () => {
  const node = { type: 'FRAME' };
  assert.equal(statusOf(compareNode('r', node, measured(), ctx), 'fill'), 'ok');
  assert.equal(
    statusOf(
      compareNode(
        'r',
        node,
        measured({ backgroundColor: 'rgba(255, 255, 255, 1)' }),
        ctx,
      ),
      'fill',
    ),
    'FAIL',
  );
});

test('borders are checked side by side, and an invisible border is no border', () => {
  const card = {
    type: 'FRAME',
    stroke: { hex: '#000000' },
    strokeWeights: '0,0,1,0',
  };
  const bottomOnly = measured({
    borderWidths: [0, 0, 1, 0],
    borderColors: Array(4).fill('rgba(0, 0, 0, 1)'),
  });
  assert.equal(
    statusOf(compareNode('r', card, bottomOnly, ctx), 'stroke width'),
    'ok',
  );
  const allSides = measured({
    borderWidths: [1, 1, 1, 1],
    borderColors: Array(4).fill('rgba(0, 0, 0, 1)'),
  });
  assert.equal(
    statusOf(compareNode('r', card, allSides, ctx), 'stroke width'),
    'FAIL',
  );
  const transparentBorder = measured({ borderWidths: [1, 1, 1, 1] });
  assert.equal(
    statusOf(
      compareNode('r', { type: 'FRAME' }, transparentBorder, ctx),
      'stroke width',
    ),
    undefined,
  );
});

test('each corner is checked, and a pill is a pill at any radius', () => {
  const rows = compareNode(
    'r',
    { type: 'FRAME', radius: '8/8/0/0' },
    measured({ radii: [8, 8, 8, 8] }),
    ctx,
  );
  assert.equal(statusOf(rows, 'radius'), 'FAIL');
  const pill = compareNode(
    'r',
    { type: 'FRAME', radius: 999 },
    measured({ h: 40, radii: [20, 20, 20, 20] }),
    ctx,
  );
  assert.equal(statusOf(pill, 'radius'), 'ok');
});

test('opacity, shadows and blur are checked', () => {
  const node = {
    type: 'FRAME',
    opacity: 0.5,
    effects: [
      {
        type: 'DROP_SHADOW',
        radius: 4,
        spread: 0,
        offset: '0,2',
        color: 'rgba(0,0,0,0.2)',
      },
      { type: 'BACKGROUND_BLUR', radius: 8 },
    ],
  };
  const good = measured({
    opacity: 0.5,
    boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 4px 0px',
    backdropFilter: 'blur(8px)',
  });
  const rows = compareNode('r', node, good, ctx);
  assert.deepEqual(
    [
      statusOf(rows, 'opacity'),
      statusOf(rows, 'shadow'),
      statusOf(rows, 'blur'),
    ],
    ['ok', 'ok', 'ok'],
  );
  const flat = compareNode('r', node, measured({ opacity: 1 }), ctx);
  assert.deepEqual(
    [
      statusOf(flat, 'opacity'),
      statusOf(flat, 'shadow'),
      statusOf(flat, 'blur'),
    ],
    ['FAIL', 'FAIL', 'FAIL'],
  );
});

test('weight comes from the text style, through figma.json', () => {
  const node = {
    type: 'TEXT',
    text: { size: 14, weight: 400, style: 'Body/Strong' },
  };
  const styles = {
    ...ctx,
    textStyles: { 'Body/Strong': 'type-body-sm-strong' },
  };
  assert.equal(
    statusOf(
      compareNode(
        't',
        node,
        measured({ fontSize: 14, typeClasses: ['type-body-sm-strong'] }),
        styles,
      ),
      'style',
    ),
    'ok',
  );
  assert.equal(
    statusOf(
      compareNode(
        't',
        node,
        measured({ fontSize: 14, typeClasses: ['type-body-sm'] }),
        styles,
      ),
      'style',
    ),
    'FAIL',
  );
  const unmapped = compareNode('t', node, measured({ fontSize: 14 }), ctx);
  assert.equal(statusOf(unmapped, 'style'), 'SKIP');
  assert.equal(statusOf(unmapped, 'weight'), 'ok');
});

test('line height, letter spacing and case are checked', () => {
  const node = {
    type: 'TEXT',
    text: { size: 12, lineHeight: '150%', letterSpacing: '5%', case: 'UPPER' },
  };
  const good = measured({
    fontSize: 12,
    lineHeight: '18px',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  });
  const rows = compareNode('t', node, good, ctx);
  assert.deepEqual(
    ['line height', 'letter spacing', 'case'].map((p) => statusOf(rows, p)),
    ['ok', 'ok', 'ok'],
  );
  const bad = compareNode('t', node, measured({ fontSize: 12 }), ctx);
  assert.deepEqual(
    ['line height', 'letter spacing', 'case'].map((p) => statusOf(bad, p)),
    ['FAIL', 'FAIL', 'FAIL'],
  );
});

test('a written reason excuses one property', () => {
  const rows = compareNode(
    'r',
    { type: 'FRAME', h: 36 },
    measured({ h: 40 }),
    ctx,
    { 'box.h': 'snapped to the 40px control height' },
  );
  assert.equal(statusOf(rows, 'h'), 'SKIP');
  assert.match(rows[0].actual, /snapped/);
});

test('order follows the screen, and a swap fails', () => {
  const flat = flatten({
    name: 'Card',
    layout: { dir: 'VERTICAL' },
    children: [{ name: 'Title' }, { name: 'Date' }],
  });
  const right = { 'root/Title': { x: 0, y: 0 }, 'root/Date': { x: 0, y: 20 } };
  const swapped = {
    'root/Title': { x: 0, y: 20 },
    'root/Date': { x: 0, y: 0 },
  };
  assert.equal(orderRows(flat, right)[0].status, 'ok');
  assert.equal(orderRows(flat, swapped)[0].status, 'FAIL');
});

test('the summary counts what still needs work', () => {
  assert.deepEqual(
    summarize([
      { status: 'ok' },
      { status: 'FAIL' },
      { status: 'UNACCOUNTED' },
      { status: 'SKIP' },
    ]),
    {
      ok: 1,
      FAIL: 1,
      UNACCOUNTED: 1,
      SKIP: 1,
      bad: 2,
    },
  );
});

test('colours are converted by maths, translucent ones included', () => {
  assert.equal(toRgb('oklch(1 0 0 / 10%)'), 'rgba(255, 255, 255, 0.1)');
  assert.equal(toRgb('color(srgb 1 1 1 / 0.1)'), 'rgba(255, 255, 255, 0.1)');
  assert.equal(toRgb('oklch(0 0 0)'), 'rgba(0, 0, 0, 1)');
  assert.equal(toRgb('#fff8'), 'rgba(255, 255, 255, 0.533)');
  assert.ok(sameColor(toRgb('oklch(0.628 0.2577 29.23)'), '#ff0000'));
});

test('layer opacity and colour are checked as one look', () => {
  const text = (over) => ({ type: 'TEXT', text: { size: 16 }, ...over });
  const faded = text({ fill: { hex: '#ffffff' }, opacity: 0.8 });
  const tinted = text({ fill: { hex: 'rgba(255,255,255,0.8)' } });
  const opaque = measured({ color: 'rgba(255, 255, 255, 1)', opacity: 0.8 });
  const see = measured({ color: 'rgba(255, 255, 255, 0.8)' });
  for (const node of [faded, tinted])
    for (const got of [opaque, see])
      assert.equal(statusOf(compareNode('t', node, got, ctx), 'fill'), 'ok');
  assert.equal(
    statusOf(compareNode('t', faded, opaque, ctx), 'opacity'),
    undefined,
  );
});

test('a token with no CSS variable is reported, not guessed', () => {
  const rows = compareNode(
    'root',
    { type: 'FRAME', fill: { token: 'text/primary', hex: '#ffffff' } },
    measured({ backgroundColor: 'rgba(255, 255, 255, 1)' }),
    ctx,
  );
  assert.equal(statusOf(rows, 'token'), 'FAIL');
});

test("a token's page value is checked against Figma's own value", () => {
  const node = { type: 'FRAME', fill: { token: 'Brand', hex: '#ff0000' } };
  const got = measured({ backgroundColor: 'rgba(0, 0, 255, 1)' });
  const rows = compareNode('root', node, got, {
    ...ctx,
    tokenValues: { Brand: 'rgba(0, 0, 255, 1)' },
    figmaTokens: { Brand: { Light: '#ff0000', Dark: '#00ff00' } },
  });
  assert.equal(statusOf(rows, 'fill'), 'ok', 'the page agrees with itself');
  assert.equal(statusOf(rows, 'token value'), 'FAIL', 'but not with Figma');
});

test("a text layer's shadow is a text-shadow", () => {
  const node = {
    type: 'TEXT',
    text: { size: 16 },
    effects: [
      {
        type: 'DROP_SHADOW',
        radius: 4,
        offset: '0,2',
        color: 'rgba(0,0,0,0.5)',
      },
    ],
  };
  const rows = compareNode(
    't',
    node,
    measured({ textShadow: 'rgba(0, 0, 0, 0.5) 0px 2px 4px' }),
    ctx,
  );
  assert.equal(statusOf(rows, 'text shadow'), 'ok');
});

test('sizes set by a missing font are skipped, and the font is named', () => {
  const node = {
    type: 'TEXT',
    w: 80,
    h: 20,
    sizing: 'HUG/HUG',
    text: { size: 16, family: 'Caslon Doric' },
  };
  const rows = compareNode('t', node, measured({ w: 90, h: 22 }), {
    ...ctx,
    fontsMissing: ['Caslon Doric'],
  });
  assert.equal(statusOf(rows, 'w'), 'SKIP');
  assert.equal(statusOf(rows, 'h'), 'SKIP');
  assert.match(rows.find((r) => r.prop === 'h').actual, /Caslon Doric/);
  const real = compareNode('t', node, measured({ w: 90, h: 22 }), ctx);
  assert.equal(statusOf(real, 'w'), 'FAIL');
});

const screen = {
  name: 'Screen',
  type: 'FRAME',
  children: [
    {
      name: 'Nav / Bottom',
      type: 'FRAME',
      x: 0,
      y: 800,
      children: [
        {
          name: 'Nav / Row',
          type: 'FRAME',
          x: 20,
          y: 10,
          children: [
            {
              name: 'Bolt',
              type: 'INSTANCE',
              x: 4,
              y: 4,
              children: [{ name: 'Vector', type: 'VECTOR' }],
            },
          ],
        },
      ],
    },
  ],
};

test('a map can start from a layer inside a snapshot', () => {
  const spec = { nodes: [{ tree: screen }] };
  assert.equal(
    pickTree(spec, 'nodes.0/Nav / Bottom/Nav / Row')?.name,
    'Nav / Row',
  );
  assert.equal(pickTree(spec, 'nodes.0/Nope'), undefined);
});

test('a variant is rebuilt from the base and its differences', () => {
  const base = {
    name: 'Bell',
    fill: { hex: '#000000' },
    children: [{ name: 'Label', text: { chars: 'Notify' } }],
  };
  const changes = [
    { path: 'root', prop: 'fill', from: {}, to: { hex: '#ffffff' } },
    { path: 'root/Label', prop: 'text', from: {}, to: { chars: 'Notified' } },
    { path: 'root/Check', prop: '(node)', from: null, to: 'present' },
    { path: 'root/Check', prop: 'type', from: null, to: 'VECTOR' },
  ];
  const v = applyVariant(base, changes);
  assert.equal(v.fill.hex, '#ffffff');
  assert.equal(v.children[0].text.chars, 'Notified');
  assert.equal(v.children[1].type, 'VECTOR');
  assert.equal(base.fill.hex, '#000000', 'the base is left alone');
  const spec = {
    sets: [
      {
        baseVariant: { tree: base },
        variants: [
          {
            name: 'Property 1=Notified',
            props: { 'Property 1': 'Notified' },
            changes,
          },
        ],
      },
    ],
  };
  assert.equal(pickTree(spec, 'sets.0', 'Notified').fill.hex, '#ffffff');
});

test('a skip covers what is inside it, and must name a real limit', () => {
  const flat = flatten(screen);
  const entries = resolveEntries(
    flat,
    {
      root: 'main',
      'root/Nav / Bottom': { checkedIn: 'tab-bar' },
    },
    (name) => name === 'tab-bar',
  );
  assert.equal(entries.get('root/Nav / Bottom').status, 'SKIP');
  assert.equal(
    entries.get('root/Nav / Bottom/Nav / Row/Bolt').status,
    'covered',
  );
  const lazy = resolveEntries(flat, {
    root: 'main',
    'root/Nav / Bottom': { skip: 'not built yet' },
  });
  assert.equal(lazy.get('root/Nav / Bottom').status, 'FAIL');
  const missing = resolveEntries(
    flat,
    { root: 'main', 'root/Nav / Bottom': { checkedIn: 'gone' } },
    () => false,
  );
  assert.equal(missing.get('root/Nav / Bottom').status, 'FAIL');
  const blank = resolveEntries(flat, { root: '' });
  assert.equal(blank.get('root').status, 'UNACCOUNTED');
});

test('a scaffold lists every layer once, and an icon as one entry', () => {
  const map = scaffoldMap(flatten(screen), { story: 's', tree: 'nodes.0' });
  assert.ok('root/Nav / Bottom/Nav / Row/Bolt' in map.nodes);
  assert.ok(!('root/Nav / Bottom/Nav / Row/Bolt/Vector' in map.nodes));
});

test('positions are checked inside the mapped parent, within 1px', () => {
  const flat = flatten(screen);
  const boxes = {
    root: { x: 0, y: 0 },
    'root/Nav / Bottom': { x: 0, y: 800 },
    'root/Nav / Bottom/Nav / Row': { x: 22, y: 810 },
  };
  const selectors = {
    root: 'main',
    'root/Nav / Bottom': 'nav',
    'root/Nav / Bottom/Nav / Row': 'ul',
  };
  const rows = positionRows(flat, boxes, selectors, {});
  assert.equal(rows.find((r) => r.path === 'root/Nav / Bottom').status, 'ok');
  assert.equal(
    rows.find((r) => r.path === 'root/Nav / Bottom/Nav / Row').status,
    'FAIL',
  );
});

test('only warnings inside the checked tree are shown, by kind', () => {
  const flat = flatten({
    id: '1',
    name: 'A',
    children: [{ id: '2', name: 'B' }],
  });
  const shown = scopeWarnings(
    [
      { kind: 'text-style', message: 'm', count: 100, ids: ['2', '9', '10'] },
      { kind: 'glass', message: 'g', count: 1, ids: ['9'] },
    ],
    flat,
  );
  assert.deepEqual(shown, [{ kind: 'text-style', message: 'm', count: 1 }]);
});

test('the snapshot is found inside whatever the tool saved', () => {
  const snap = { _meta: { schemaVersion: 4 }, nodes: [] };
  assert.equal(
    findSnapshot({ result: JSON.stringify(snap) })._meta.schemaVersion,
    4,
  );
  assert.equal(
    findSnapshot([
      { type: 'text', text: JSON.stringify({ success: true, result: snap }) },
    ])._meta.schemaVersion,
    4,
  );
  assert.equal(findSnapshot({ nothing: 1 }), null);
});

test('the most different areas are found', () => {
  const width = 64;
  const height = 32;
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < 32; y += 1)
    for (let x = 32; x < 64; x += 1)
      data.set([255, 0, 128, 255], (y * width + x) * 4);
  assert.deepEqual(hotRegions({ width, height, data }, [255, 0, 128]), [
    { x: 32, y: 0, w: 32, h: 32, share: 100 },
  ]);
});
