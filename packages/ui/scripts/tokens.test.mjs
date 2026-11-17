import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convert, parseColour } from './palette.mjs';
import { buildTokens, declarations, oklchToHex, toToken } from './tokens.mjs';

test('oklch to hex lands back on the same oklch', () => {
  for (const oklch of [
    'oklch(0.985 0 0)',
    'oklch(0.145 0 0)',
    'oklch(0.5 0.2 262)',
    'oklch(0.47 0.18 27)',
    'oklch(0.95 0.07 85)',
  ]) {
    const [l, c, h] = /\(([^)]+)\)/.exec(oklch)[1].split(' ').map(Number);
    const back = convert(oklchToHex(l, c, h));
    const [l2, c2] = /\(([^)]+)\)/.exec(back)[1].split(' ').map(Number);
    assert.ok(Math.abs(l - l2) < 0.005, `${oklch} came back as ${back}`);
    assert.ok(Math.abs(c - c2) < 0.005, `${oklch} came back as ${back}`);
  }
  assert.equal(oklchToHex(1, 0, 0), '#ffffff');
  assert.equal(oklchToHex(0, 0, 0), '#000000');
  /* Too saturated for sRGB (destructive's red): clipped to the nearest hex, close but not exact. */
  assert.ok(parseColour(oklchToHex(0.7, 0.4, 150)));
  assert.equal(oklchToHex(0.577, 0.245, 27.325), '#e7000b');
});

test('values become typed DTCG tokens', () => {
  const vars = new Map([
    ['radius', '0.625rem'],
    ['fast', '150ms'],
  ]);
  assert.deepEqual(toToken('a', 'oklch(1 0 0 / 10%)', vars).$value, {
    colorSpace: 'oklch',
    components: [1, 0, 0],
    alpha: 0.1,
    hex: '#ffffff',
  });
  assert.deepEqual(
    toToken('radius-sm', 'calc(var(--radius) * 0.6)', vars).$value,
    {
      value: 6,
      unit: 'px',
    },
  );
  assert.deepEqual(toToken('hover', 'var(--fast)', vars).$value, {
    value: 150,
    unit: 'ms',
  });
  assert.equal(toToken('heading-weight', '700', vars).$type, 'fontWeight');
  assert.equal(toToken('heading-1-tracking', '-0.02em', vars).$type, 'number');
  assert.deepEqual(
    toToken('e', 'cubic-bezier(0.4, 0, 0.2, 1)', vars).$value,
    [0.4, 0, 0.2, 1],
  );
  assert.equal(
    toToken('heading-font', "'Geist Variable', sans-serif", vars).$value,
    'Geist Variable',
  );
  assert.throws(
    () => toToken('x', 'color-mix(in oklch, red, blue)', vars),
    /no token type/,
  );
});

test('reads declarations with their blocks, ignoring comments', () => {
  const found = declarations(`/* --gone: 1px; */
@layer base { :root { --a: 1px; } @media (width < 48rem) { :root { --a: 2px; } } }`);
  assert.deepEqual(
    found.map((d) => [d.name, d.value, d.blocks.at(-1)]),
    [
      ['a', '1px', ':root'],
      ['a', '2px', ':root'],
    ],
  );
});

test('modes follow the override blocks, and references resolve per mode', () => {
  const doc = buildTokens({
    'palette.css':
      ':root { --bg: oklch(1 0 0); } .dark { --bg: oklch(0 0 0); }',
    'motion.css': `:root { --motion-duration-fast: 150ms; --motion-hover-duration: var(--motion-duration-fast); }
@media (prefers-reduced-motion: reduce) { :root { --motion-duration-fast: 0ms; } }`,
  });
  assert.equal(doc.Color.bg.$value.hex, '#ffffff');
  assert.equal(
    doc.Color.bg.$extensions['figma-console-mcp'].modes.Dark.hex,
    '#000000',
  );
  const hover = doc.Motion.hover.duration;
  assert.equal(hover.$value.value, 150);
  assert.equal(
    hover.$extensions['figma-console-mcp'].modes['Reduced motion'].value,
    0,
  );
});

test('a theme file nobody mapped fails instead of going missing', () => {
  assert.throws(
    () =>
      buildTokens({ 'shadows.css': ':root { --shadow-sm: 0 1px 2px black; }' }),
    /shadows\.css declare tokens/,
  );
  assert.throws(
    () =>
      buildTokens({
        'palette.css':
          '@media print { :root { --bg: oklch(1 0 0); } } :root { --bg: oklch(0 0 0); }',
      }),
    /no mode/,
  );
});
