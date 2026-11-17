import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_SIZES, projectScreens } from './project.mjs';

test('a project without settings has all three sizes', () => {
  const { screens, sizes, set } = projectScreens({});
  assert.deepEqual(screens, ['phone', 'tablet', 'desktop']);
  assert.deepEqual(sizes, DEFAULT_SIZES);
  assert.equal(set, false);
});

test("a phone-only project at the designer's frame", () => {
  const { screens, sizes, problems } = projectScreens({
    screens: ['phone'],
    sizes: { phone: { width: 402, height: 874 } },
  });
  assert.deepEqual(screens, ['phone']);
  assert.deepEqual(sizes.phone, { width: 402, height: 874 });
  assert.deepEqual(problems, []);
});

test('names unknown sizes and widths in the wrong range', () => {
  const { problems } = projectScreens({
    screens: ['watch'],
    sizes: { tablet: { width: 1100 } },
  });
  assert.equal(problems.length, 2);
  assert.match(problems[0], /watch/);
  assert.match(problems[1], /tablet width 1100/);
});
