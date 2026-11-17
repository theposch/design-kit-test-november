import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changeKind } from './look-kind.mjs';

/* A 40×40 white picture with a filled square drawn at (x, y). */
function picture({ x = 10, y = 10, size = 12, colour = [0, 0, 0] } = {}) {
  const width = 40;
  const height = 40;
  const data = Buffer.alloc(width * height * 4, 255);
  for (let py = y; py < y + size; py += 1) {
    for (let px = x; px < x + size; px += 1) {
      const i = (py * width + px) * 4;
      [data[i], data[i + 1], data[i + 2]] = colour;
    }
  }
  return { data, width, height };
}

test('a new colour on the same shape is colour only', () => {
  assert.equal(
    changeKind(picture(), picture({ colour: [40, 90, 200] })),
    'colour',
  );
});

test('a shape that moved is a layout change', () => {
  assert.equal(changeKind(picture(), picture({ x: 20 })), 'layout');
});

test('a shape that grew is a layout change', () => {
  assert.equal(changeKind(picture(), picture({ size: 18 })), 'layout');
});

test('a photo with a new size is a size change', () => {
  const taller = { ...picture(), height: 41 };
  taller.data = Buffer.alloc(40 * 41 * 4, 255);
  assert.equal(changeKind(picture(), taller), 'size');
});
