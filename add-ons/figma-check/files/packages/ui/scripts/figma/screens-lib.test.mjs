import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  boxAt,
  checkPieces,
  checkRegions,
  checkTexts,
  drawnMode,
  fixedSizes,
  gridEntry,
  health,
  layerSizes,
  piecesOf,
  survey,
  surveyLines,
  textsOf,
  widthsFor,
} from './screens-lib.mjs';

/* Small pretend snapshots, shaped like the extractor's output. */
const layer = (name, x, y, w, h, extra = {}) => ({
  name,
  type: 'FRAME',
  x,
  y,
  w,
  h,
  ...extra,
});
const text = (name, x, y, w, extra = {}) =>
  layer(name, x, y, w, 20, { type: 'TEXT', text: {}, ...extra });
const button = (x, y, w = 160) =>
  layer('Button', x, y, w, 44, {
    type: 'INSTANCE',
    component: { name: 'Button', props: { Variant: 'Primary' } },
    children: [text('Label', 16, 12, 60, { fill: { hex: '#fff' } })],
  });

/* A phone screen whose content sits `margin` in from each side. */
function screen(name, margin, { cards = true, grids } = {}) {
  const inner = 390 - margin * 2;
  const children = [
    layer('Header', 0, 0, 390, 56, { fill: { hex: '#ffffff' } }),
    text('Title', margin, 72, inner, { fill: { hex: '#111111' } }),
    text('Lead', margin, 108, inner, { fill: { hex: '#555555' } }),
  ];
  if (cards) {
    const w = (inner - 12) / 2;
    children.push(
      layer('Cards', margin, 144, inner, 120, {
        children: [
          layer('Card', 0, 0, w, 120, { fill: { hex: '#eeeeee' } }),
          layer('Card', w + 12, 0, w, 120, { fill: { hex: '#eeeeee' } }),
        ],
      }),
    );
  }
  children.push(button(margin, 280, inner));
  return {
    name,
    tree: layer(name, 0, 0, 390, 844, {
      children,
      ...(grids ? { grids } : {}),
    }),
  };
}

test('a file with raw colours, no styles and loose layers is messy', () => {
  const { tree } = screen('Home', 20);
  tree.children.push(
    layer('Button', 20, 340, 350, 44, {
      type: 'GROUP',
      children: [
        layer('Rectangle 12', 0, 0, 350, 44, { fill: { hex: '#ff0000' } }),
        text('Text', 16, 12, 60),
      ],
    }),
  );
  const result = health({ nodes: [{ tree }] }, { libraryNames: ['Card'] });
  assert.equal(result.verdict, 'messy');
  assert.equal(result.ratios.colourTokens, 0);
  /* Button is a component this file uses; Card is an everyday frame name, so it isn't counted. */
  assert.deepEqual(result.counts.detached, ['Button']);
  assert.match(result.line, /colours 0% on tokens/);
  assert.match(result.line, /1 detached copy \(Button ×1\)/);
  assert.match(result.line, /1 layer with default names/);
});

test('a file on tokens, styles and auto-layout is tidy', () => {
  const tree = layer('Home', 0, 0, 390, 844, {
    layout: { dir: 'VERTICAL', gap: 16, pad: '24,16,24,16' },
    fill: { hex: '#fff', token: 'surface' },
    children: [
      text('Title', 16, 24, 358, {
        fill: { hex: '#111', token: 'foreground' },
        text: { style: 'Heading/Large' },
      }),
      layer('Actions', 16, 60, 358, 44, {
        layout: { dir: 'HORIZONTAL', gap: 8, pad: '0,0,0,0' },
        children: [button(0, 0), button(168, 0)],
      }),
    ],
  });
  const result = health({ nodes: [{ tree }] });
  assert.equal(result.verdict, 'tidy');
  assert.equal(result.counts.instances, 2);
  /* The label inside each Button belongs to the component, not the screen. */
  assert.equal(result.counts.texts, 1);
});

test('the survey finds the shared margin, the repeats and the odd one out', () => {
  const result = survey([
    screen('Home', 20),
    screen('Search', 20),
    screen('Profile', 20, { cards: false }),
    screen('Settings', 24, { cards: false }),
  ]);
  assert.equal(result.margin, 20);
  assert.equal(result.marginCount, 3);
  assert.deepEqual(result.outliers, [{ name: 'Settings', margin: 24 }]);
  assert.deepEqual(result.rows, [{ count: 2, gap: 12, screens: 2 }]);
  assert.ok(result.steps.some((s) => s.value === 16));
  assert.deepEqual(
    result.offGrid.find((v) => v.value === 20).nearest,
    [16, 24],
  );
  const lines = surveyLines(result).join('\n');
  assert.match(lines, /Side margin: 20 on 3 of 4 screens/);
  assert.match(lines, /"Settings" uses 24: on purpose, or a slip\?/);
  assert.match(lines, /2 per row with a 12 gap/);
  assert.deepEqual(gridEntry(result), {
    margin: 20,
    spacing: result.steps.map((s) => s.value),
    columns: 2,
    gutter: 12,
    screens: 4,
  });
});

test('a layout grid the screens ignore is named', () => {
  const grids = [{ pattern: 'COLUMNS', count: 4, gutter: 16, offset: 16 }];
  const result = survey([screen('Home', 20, { grids }), screen('Search', 20)]);
  assert.equal(result.ignoredGrids.length, 1);
  assert.match(
    surveyLines(result).join('\n'),
    /layout grid with a 16 margin, but its own content sits at 20/,
  );
});

test('pieces: a button that became something else fails', () => {
  const { tree } = screen('Home', 20);
  tree.children.push(
    layer('Tag', 20, 340, 60, 24, {
      type: 'INSTANCE',
      component: { name: 'Tag' },
    }),
  );
  const pieces = piecesOf(tree);
  assert.equal(pieces.get('Button'), 1);
  const rows = checkPieces(
    pieces,
    { Button: { use: 'Button', selector: 'button' } },
    { button: 0 },
    new Set(['Button']),
  );
  assert.equal(rows.find((r) => r.name === 'Button').status, 'FAIL');
  assert.equal(rows.find((r) => r.name === 'Tag').status, 'UNMAPPED');
  const ok = checkPieces(
    pieces,
    {
      Button: { use: 'Button', selector: 'button' },
      Tag: { skip: 'decorative, drawn in the card' },
    },
    { button: 1 },
  );
  assert.deepEqual(
    ok.map((r) => r.status),
    ['PASS', 'SKIP'],
  );
});

test('regions: place and width must match within the grid, height may grow', () => {
  const { tree } = screen('Home', 20);
  assert.deepEqual(boxAt(tree, 'Cards/Card#2'), {
    x: 20 + 169 + 12,
    y: 144,
    w: 169,
    h: 120,
  });
  const rows = checkRegions(
    tree,
    { Header: 'header', Cards: '[data-region=cards]', Title: 'h1' },
    {
      header: { x: 0, y: 0, w: 390, h: 72 },
      '[data-region=cards]': { x: 32, y: 144, w: 326, h: 120 },
    },
  );
  assert.equal(rows[0].status, 'PASS');
  assert.match(rows[0].note, /height differs by 16/);
  assert.equal(rows[1].status, 'FAIL');
  assert.match(rows[1].note, /x off by 12/);
  assert.match(rows[2].note, /nothing on the page/);
});

test('phone screens are checked small, at the frame and large', () => {
  assert.deepEqual(widthsFor(390), [320, 390, 430]);
  assert.deepEqual(widthsFor(402), [320, 402, 430]);
  assert.deepEqual(widthsFor(1440), [1440]);
});

test('sizes copied from the frame are found in the code', () => {
  const hits = fixedSizes(
    `<main className="w-[390px]">\n<div className="h-screen">\n<p>ok</p>`,
    { w: 390, h: 844 },
  );
  assert.deepEqual(
    hits.map((h) => h.line),
    [1, 2],
  );
});

test('no margin shared by most screens is reported as unclear', () => {
  const result = survey([
    screen('A', 12, { cards: false }),
    screen('B', 24, { cards: false }),
    screen('C', 16, { cards: false }),
  ]);
  assert.equal(result.margin, null);
  assert.deepEqual(result.outliers, []);
  assert.match(
    surveyLines(result).join('\n'),
    /no clear one .*A 12, B 24, C 16\. Ask which is meant/,
  );
});

test('a centred logo does not count as the side margin', () => {
  const { tree } = screen('Home', 16, { cards: false });
  tree.children.push(layer('Logo', 155, 400, 80, 80));
  assert.equal(survey([{ name: 'Home', tree }]).margin, 16);
});

test('a row running off the right edge is a sideways-scrolling row', () => {
  const { tree } = screen('Home', 16, { cards: false });
  tree.children.push(
    layer('Shelf', 0, 400, 390, 200, {
      children: [0, 1, 2].map((i) => layer('Tile', 16 + i * 168, 0, 160, 200)),
    }),
  );
  const result = survey([{ name: 'Home', tree }]);
  assert.deepEqual(result.scrollRows, [{ start: 16, gap: 8, screens: 1 }]);
  assert.deepEqual(result.rows, []);
  assert.match(surveyLines(result).join('\n'), /scroll sideways: starting 16/);
  assert.deepEqual(gridEntry(result).scrollRow, { start: 16, gap: 8 });
});

test('regions below a snapped gap are judged by their own gap', () => {
  const { tree } = screen('Home', 20);
  /* Title 72 → 64 snapped, so everything below moves up 8: each gap still matches. */
  const rows = checkRegions(
    tree,
    {
      Title: 'h1',
      Lead: 'p',
      Cards: 'ul',
      Header: { selector: 'header', pinned: true },
    },
    {
      h1: { x: 20, y: 60, w: 350, h: 20 },
      p: { x: 20, y: 96, w: 350, h: 20 },
      ul: { x: 20, y: 132, w: 350, h: 120 },
      header: { x: 0, y: 0, w: 390, h: 56 },
    },
  );
  assert.deepEqual(
    rows.map((r) => r.status),
    ['FAIL', 'PASS', 'PASS', 'PASS'],
  );
  assert.match(rows[0].note, /y off by -12/);
  const later = checkRegions(
    tree,
    { Title: 'h1', Lead: 'p' },
    {
      h1: { x: 20, y: 72, w: 350, h: 20 },
      p: { x: 20, y: 140, w: 350, h: 20 },
    },
  );
  assert.match(later[1].note, /gap below Title off by 32/);
});

test('pieces: a new component is not done, and "later" is not a reason to skip', () => {
  const rows = checkPieces(
    new Map([
      ['Chip', 2],
      ['Badge', 1],
      ['Map', 1],
    ]),
    {
      Chip: { new: 'filter chip, used on three screens' },
      Badge: { skip: 'not built yet' },
      Map: { skip: 'needs a map provider the project has no licence for' },
    },
  );
  assert.deepEqual(
    rows.map((r) => r.status),
    ['NEW', 'FAIL', 'SKIP'],
  );
});

test('Tailwind sizes and ratios copied from the frame are found', () => {
  const { tree } = screen('Home', 20);
  tree.children.push(layer('Poster', 20, 400, 160, 240));
  const hits = fixedSizes(
    [
      '<img className="w-40 aspect-[160/240]" />',
      '<div className="max-w-sm size-6 h-10" />',
      '<div className="aspect-[3/4]" />',
    ].join('\n'),
    { w: 390, h: 844 },
    layerSizes(tree),
  );
  assert.deepEqual(
    hits.map((h) => h.line),
    [1, 1],
  );
  assert.match(hits[0].note, /w-40 is 160px/);
  assert.match(hits[1].note, /aspect-\[160\/240\]/);
});

test('texts: face, size, weight and colour of each run are checked', () => {
  const tree = layer('Home', 0, 0, 390, 844, {
    fill: { hex: '#0a0a0a' },
    children: [
      text('Title', 16, 16, 300, {
        fill: { hex: '#ffffff' },
        text: { chars: 'Top videos', family: 'Inter', size: 24, weight: 700 },
      }),
      text('Caption', 16, 60, 300, {
        fill: 'MIXED',
        text: {
          chars: 'New today',
          runs: [
            {
              chars: 'New ',
              hex: '#ffffff',
              family: 'Oswald',
              size: 16,
              weight: 700,
            },
            {
              chars: 'today',
              hex: '#ffcc00',
              family: 'Oswald',
              size: 16,
              weight: 700,
            },
          ],
        },
      }),
      text('Gone', 16, 100, 300, { text: { chars: 'Not built' } }),
    ],
  });
  assert.equal(drawnMode(tree), 'dark');
  assert.equal(drawnMode(tree, { drawnIn: 'light' }), 'light');
  const rows = checkTexts(textsOf(tree), {
    'Top videos': {
      family: '"Inter Variable", sans-serif',
      size: 24,
      weight: '700',
      color: 'rgb(255, 255, 255)',
    },
    New: {
      family: 'Oswald',
      size: 16,
      weight: '700',
      color: 'rgb(255, 255, 255)',
    },
    today: {
      family: 'Inter',
      size: 16,
      weight: '700',
      color: 'rgb(255, 255, 255)',
    },
  });
  assert.deepEqual(
    rows.map((r) => r.status),
    ['PASS', 'PASS', 'FAIL', 'MISSING'],
  );
  assert.match(
    rows[2].note,
    /face Inter, Figma Oswald, colour .*Figma #ffcc00/,
  );
});
