/*
 * Runs the extractor against a small pretend Figma file, so what it records
 * (and what it warns about) is checked without Figma open.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(
  path.resolve(here, '../../../../.claude/skills/figma-check/extract.js'),
  'utf8',
);
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const extract = new AsyncFunction('figma', 'SPEC', source);

const box = (x, y, width, height) => ({ x, y, width, height });

function node(props) {
  const n = {
    visible: true,
    opacity: 1,
    fills: [],
    strokes: [],
    effects: [],
    children: [],
    ...props,
  };
  n.width = n.absoluteBoundingBox.width;
  n.height = n.absoluteBoundingBox.height;
  for (const c of n.children) c.parent = n;
  return n;
}

const white = { r: 1, g: 1, b: 1, a: 1 };

function file() {
  const label = (id, chars, x) =>
    node({
      id,
      name: 'Label',
      type: 'TEXT',
      characters: chars,
      fontSize: 14,
      fontWeight: 600,
      fontName: { family: 'Inter', style: 'Semi Bold' },
      lineHeight: { unit: 'PIXELS', value: 20 },
      letterSpacing: { unit: 'PIXELS', value: 0 },
      textCase: 'ORIGINAL',
      textDecoration: 'NONE',
      textAlignHorizontal: 'LEFT',
      leadingTrim: 'CAP_HEIGHT',
      textStyleId: '',
      absoluteBoundingBox: box(x + 12, 10, 40, 20),
      fills: [
        {
          type: 'SOLID',
          color: white,
          opacity: 0.8,
          boundVariables: { color: { id: 'var:text' } },
        },
      ],
    });
  const variant = (id, name, value, x, extra = {}) =>
    node({
      id,
      name,
      type: 'COMPONENT',
      variantProperties: { 'Property 1': value },
      absoluteBoundingBox: box(x, 0, 64, 40),
      absoluteRenderBounds: box(x - 4, -2, 72, 48),
      layoutMode: 'HORIZONTAL',
      itemSpacing: 8,
      paddingTop: 10,
      paddingRight: 12,
      paddingBottom: 10,
      paddingLeft: 12,
      fills: [
        { type: 'VIDEO', videoHash: 'v1' },
        {
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
          opacity: 0.5,
          blendMode: 'LINEAR_DODGE',
        },
      ],
      effects: [
        {
          type: 'GLASS',
          visible: true,
          radius: 12,
          lightAngle: -45,
          lightIntensity: 0.6,
          refraction: 0.8,
          depth: 20,
        },
      ],
      children: [label(`${id}:label`, value, x)],
      ...extra,
    });
  const notify = variant('1:1', 'Property 1=Notify', 'Notify', 0);
  const notified = variant('1:2', 'Property 1=Notified', 'Notified', 100);
  const set = node({
    id: '1:0',
    name: 'Bell',
    type: 'COMPONENT_SET',
    absoluteBoundingBox: box(0, 0, 200, 40),
    componentPropertyDefinitions: {
      'Property 1': { type: 'VARIANT', defaultValue: 'Notify' },
    },
    children: [notify, notified],
  });
  const all = {};
  const index = (n) => {
    all[n.id] = n;
    n.children.forEach(index);
  };
  index(set);
  return {
    fileKey: 'KEY',
    root: { name: 'Pretend file' },
    mixed: Symbol('mixed'),
    getNodeByIdAsync: async (id) => all[id] ?? null,
    getStyleByIdAsync: async () => null,
    variables: {
      getVariableByIdAsync: async (id) =>
        id === 'var:text'
          ? {
              name: 'text/primary',
              remote: true,
              variableCollectionId: 'col',
              valuesByMode: { m1: white },
            }
          : null,
      getVariableCollectionByIdAsync: async () => ({
        name: 'Colours',
        modes: [{ modeId: 'm1', name: 'Dark' }],
      }),
    },
  };
}

const run = () => extract(file(), { slug: 'bell', set: '1:0' });

test('records library variables and where they come from', async () => {
  const spec = await run();
  assert.deepEqual(spec.variables['text/primary'], {
    collection: 'Colours',
    remote: true,
  });
  assert.equal(spec.tokens['text/primary'].Dark, '#ffffff');
});

test('groups warnings by kind, with the node ids they came from', async () => {
  const spec = await run();
  const kinds = Object.fromEntries(spec.warnings.map((w) => [w.kind, w]));
  assert.ok(kinds.video, 'video fills are warned about');
  assert.ok(kinds.glass, 'glass is warned about');
  assert.ok(kinds['leading-trim'], 'cap-height trim is warned about');
  assert.ok(kinds['blend-plus-lighter'], 'Linear dodge maps to plus-lighter');
  assert.equal(kinds['text-style'].count, 2);
  assert.ok(kinds['text-style'].ids.includes('1:1:label'));
  assert.ok(!spec.warnings.some((w) => /cannot express/.test(w.message)));
});

test('keeps glass settings, blends, trims and the drawn size', async () => {
  const tree = (await run()).sets[0].baseVariant.tree;
  const glass = tree.effects.find((e) => e.type === 'GLASS');
  assert.equal(glass.lightAngle, -45);
  assert.equal(glass.depth, 20);
  assert.equal(tree.fill[1].blend, 'plus-lighter');
  assert.equal(tree.fill[0].videoHash, 'v1');
  assert.deepEqual(tree.drawn, { w: 72, h: 48, dx: -4, dy: -2 });
  assert.equal(tree.children[0].text.trim, 'CAP_HEIGHT');
});

test('writes a solid paint opacity once, inside the colour', async () => {
  const tree = (await run()).sets[0].baseVariant.tree;
  assert.equal(tree.fill[1].hex, 'rgba(0,0,0,0.5)');
  assert.equal(tree.fill[1].opacity, undefined);
});

test('treats an on/off pair as a state and ignores canvas position', async () => {
  const set = (await run()).sets[0];
  assert.equal(set.axisClassification['Property 1'].isState, true);
  assert.equal(set.axisClassification['Property 1'].onOff, true);
  const notified = set.variants.find((v) => v.name.endsWith('Notified'));
  assert.ok(
    !notified.changes.some((c) => c.path === 'root' && /^[xy]$/.test(c.prop)),
  );
  assert.ok(notified.changes.some((c) => c.prop === 'text'));
});

test('records which component an instance comes from, pins and layout grids', async () => {
  const instance = node({
    id: '2:2',
    name: 'Primary',
    type: 'INSTANCE',
    absoluteBoundingBox: box(20, 300, 350, 44),
    constraints: { horizontal: 'LEFT_RIGHT', vertical: 'TOP' },
    componentProperties: { 'Label#1:2': { type: 'TEXT', value: 'Go' } },
    getMainComponentAsync: async () => ({
      name: 'Size=Large',
      remote: true,
      parent: { type: 'COMPONENT_SET', name: 'Button' },
    }),
  });
  const screen = node({
    id: '2:0',
    name: 'Home',
    type: 'FRAME',
    absoluteBoundingBox: box(0, 0, 390, 844),
    layoutMode: 'NONE',
    layoutGrids: [
      {
        pattern: 'COLUMNS',
        count: 4,
        gutterSize: 16,
        offset: 20,
        alignment: 'STRETCH',
        visible: true,
      },
    ],
    children: [instance],
  });
  const figma = {
    ...file(),
    getNodeByIdAsync: async (id) =>
      ({ '2:0': screen, '2:2': instance })[id] ?? null,
  };
  const spec = await extract(figma, { slug: 'home', nodes: ['2:0'] });
  const tree = spec.nodes[0].tree;
  assert.deepEqual(tree.grids[0], {
    pattern: 'COLUMNS',
    count: 4,
    gutter: 16,
    offset: 20,
    align: 'STRETCH',
    size: undefined,
  });
  const button = tree.children[0];
  assert.deepEqual(button.component, {
    name: 'Button',
    remote: true,
    props: { Label: 'Go' },
  });
  assert.equal(button.constraints, 'LEFT_RIGHT/TOP');
});

test('keeps a picture crop and every colour of two-colour text', async () => {
  const base = file();
  const caption = node({
    id: '3:1',
    name: 'Caption',
    type: 'TEXT',
    characters: 'Top 10 videos',
    fontSize: 16,
    fontWeight: 700,
    fontName: { family: 'Inter', style: 'Bold' },
    fills: base.mixed,
    absoluteBoundingBox: box(0, 0, 200, 20),
    getStyledTextSegments: () => [
      {
        characters: 'Top 10 ',
        fills: [{ type: 'SOLID', color: white }],
        fontSize: 16,
        fontWeight: 700,
        fontName: { family: 'Inter' },
      },
      {
        characters: 'videos',
        fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
        fontSize: 16,
        fontWeight: 700,
        fontName: { family: 'Inter' },
      },
    ],
  });
  const photo = node({
    id: '3:2',
    name: 'Photo',
    type: 'RECTANGLE',
    absoluteBoundingBox: box(0, 40, 160, 240),
    fills: [
      {
        type: 'IMAGE',
        imageHash: 'abc',
        scaleMode: 'CROP',
        imageTransform: [
          [0.5, 0, 0.25],
          [0, 0.5, 0.1],
        ],
      },
    ],
  });
  const frame = node({
    id: '3:0',
    name: 'Card',
    type: 'FRAME',
    absoluteBoundingBox: box(0, 0, 200, 300),
    children: [caption, photo],
  });
  const figma = {
    ...base,
    getNodeByIdAsync: async (id) =>
      ({ '3:0': frame, '3:1': caption, '3:2': photo })[id] ?? null,
  };
  const tree = (await extract(figma, { slug: 'card', nodes: ['3:0'] })).nodes[0]
    .tree;
  assert.deepEqual(
    tree.children[0].text.runs.map((r) => [r.chars, r.hex]),
    [
      ['Top 10 ', '#ffffff'],
      ['videos', '#000000'],
    ],
  );
  assert.deepEqual(tree.children[1].fill.crop, [
    [0.5, 0, 0.25],
    [0, 0.5, 0.1],
  ]);
});
