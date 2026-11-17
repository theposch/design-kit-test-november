import assert from 'node:assert/strict';
import { test } from 'node:test';
import { convert, nearest, paletteColours, parseColour } from './palette.mjs';

test('converts hex, short hex and rgb', () => {
  assert.equal(convert('#ffffff'), 'oklch(1 0 0)');
  assert.equal(convert('#000'), 'oklch(0 0 0)');
  assert.equal(convert('rgb(255, 0, 0)'), 'oklch(0.628 0.258 29.2)');
  assert.equal(convert('#0000ff'), 'oklch(0.452 0.313 264.1)');
});

test('keeps see-through colours see-through', () => {
  assert.equal(convert('rgba(255,255,255,0.2)'), 'oklch(1 0 0 / 20%)');
  assert.equal(convert('#00000080'), 'oklch(0 0 0 / 50.2%)');
});

test('refuses what it cannot read', () => {
  assert.equal(convert('tomato'), null);
  assert.equal(convert('rgb(1,2)'), null);
});

test('names the nearest palette colour, light and dark', () => {
  const palette = paletteColours(`:root {
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.5 0.2 262);
}
.dark {
  --foreground: oklch(0.985 0 0);
  --overlay: oklch(1 0 0 / 20%);
}`);
  assert.equal(palette.length, 4);
  const black = nearest(parseColour('#111111'), palette);
  assert.equal(black.name, 'foreground');
  assert.equal(black.mode, 'light');
  assert.ok(black.distance < 0.05);
  assert.equal(
    nearest(parseColour('rgba(255,255,255,0.2)'), palette).name,
    'overlay',
  );
});
