import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  chooseRows,
  CLOSE,
  OPEN,
  place,
  readLibrary,
  table,
  uncovered,
} from './guide.mjs';

const story = (rows) => `
const meta = {
  parameters: {
    ...usage({
      choose: [${rows}],
      purpose: 'Does a thing.',
    }),
  },
};
`;

function library(files) {
  const dir = mkdtempSync(path.join(tmpdir(), 'guide-'));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return readLibrary(dir);
}

test('reads the rows a story declares, in order', () => {
  assert.deepEqual(
    chooseRows(
      story(
        "{ need: 'run an action', not: 'a `div`' }, { need: 'b', use: '`A` / `B`', not: 'c' }",
      ),
    ),
    [
      { need: 'run an action', not: 'a `div`' },
      { need: 'b', use: '`A` / `B`', not: 'c' },
    ],
  );
});

test('a story with no rows gives none', () => {
  assert.deepEqual(chooseRows("usage({ purpose: 'x' })"), []);
});

test('a row built from a variable is refused, with the file named', () => {
  assert.throws(
    () => chooseRows(story('{ need: NEED, not: "x" }'), 'Button.stories.tsx'),
    /Button\.stories\.tsx.*plain strings/,
  );
});

test('a row missing its "not" is refused', () => {
  assert.throws(() => chooseRows(story("{ need: 'x' }")), /need and not/);
});

test('rows default to their own component and run tier by tier', () => {
  const { components, rows } = library({
    'molecules/Toaster.tsx': '',
    'molecules/Toaster.stories.tsx': story("{ need: 'hear', not: 'x' }"),
    'atoms/Radio.tsx': '',
    'atoms/Radio.stories.tsx': story(
      "{ need: 'pick one', use: '`Radio` in a `RadioGroup`', not: 'y' }",
    ),
    'atoms/RadioGroup.tsx': '',
  });
  assert.deepEqual(components, ['Radio', 'RadioGroup', 'Toaster']);
  assert.deepEqual(
    rows.map((row) => row.use),
    ['`Radio` in a `RadioGroup`', '`Toaster`'],
  );
});

test('a component no row names is reported', () => {
  const found = library({
    'atoms/Button.tsx': '',
    'atoms/Button.stories.tsx': story("{ need: 'run', not: 'x' }"),
    'atoms/Avatar.tsx': '',
    'atoms/Avatar.stories.tsx': "usage({ purpose: 'x' })",
  });
  assert.deepEqual(uncovered(found), ['Avatar']);
});

test('the table escapes a pipe so it stays one cell', () => {
  assert.match(
    table([{ need: 'a | b', use: '`A`', not: 'c' }]),
    /\| a \\\| b \| `A` \| c \|/,
  );
});

test('the table goes between the markers and leaves the rest alone', () => {
  const guide = `before\n\n${OPEN}\n\nold\n\n${CLOSE}\n\nafter\n`;
  assert.equal(
    place(guide, 'new'),
    `before\n\n${OPEN}\n\nnew\n\n${CLOSE}\n\nafter\n`,
  );
});

test('a guide without markers is refused', () => {
  assert.throws(() => place('no markers here', 'new'), /markers/);
});
