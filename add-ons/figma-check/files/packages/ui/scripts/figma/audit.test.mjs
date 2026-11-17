/*
 * The whole check, end to end, against the real Button and a hand-written
 * snapshot of its sizes, so it runs with no Figma. One clean run, then one
 * deliberate mistake per kind of check, each of which must be caught.
 */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { promisify } from 'node:util';

import { buildStorybook, PACKAGE, serve } from '../lib/storybook.mjs';

const FIXTURES = path.join(import.meta.dirname, 'fixtures');
let site;
let tmp;

/* Not spawnSync: the Storybook server lives in this process and has to keep answering. */
async function run(args) {
  try {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [
      path.join(import.meta.dirname, 'audit.mjs'),
      ...args,
    ]);
    return { code: 0, out: stdout + stderr };
  } catch (error) {
    return {
      code: error.code ?? 1,
      out: (error.stdout ?? '') + (error.stderr ?? ''),
    };
  }
}

before(async () => {
  tmp = mkdtempSync(path.join(tmpdir(), 'figma-audit-'));
  const build = path.join(PACKAGE, '.figma', 'storybook');
  buildStorybook(build);
  site = await serve(build);
});
after(() => {
  site?.close();
  rmSync(tmp, { recursive: true, force: true });
});

async function audit(change) {
  const dir = mkdtempSync(path.join(tmp, 'specs-'));
  cpSync(FIXTURES, dir, { recursive: true });
  if (change) {
    const file = path.join(dir, 'button-sizes.json');
    const spec = JSON.parse(readFileSync(file, 'utf8'));
    change(spec.nodes[0].tree);
    writeFileSync(file, JSON.stringify(spec));
  }
  return run([
    'button-sizes',
    '--specs',
    dir,
    '--config',
    path.join(dir, 'figma.json'),
    '--url',
    site.url,
    '--mode',
    'light',
  ]);
}

const failing = (out) =>
  out
    .split('\n')
    .filter((line) => /\b(FAIL|UNACCOUNTED)\s*$/.test(line))
    .map((line) => line.trim());

test('a faithful port passes, in light and dark', async () => {
  const dir = path.join(tmp, 'clean');
  cpSync(FIXTURES, dir, { recursive: true });
  const { code, out } = await run([
    'button-sizes',
    '--specs',
    dir,
    '--config',
    path.join(dir, 'figma.json'),
    '--url',
    site.url,
  ]);
  assert.equal(code, 0, out);
  assert.match(out, /\(Light\)/);
  assert.match(out, /\(Dark\)/);
});

const kid = (tree, name) => tree.children.find((c) => c.name === name);
const MISTAKES = {
  'a wrong height': [
    (t) => {
      kid(t, 'Medium').h = 36;
    },
    /box\s+h\s+36/,
  ],
  'wrong padding': [
    (t) => {
      kid(t, 'Small').layout.pad = '0,10,0,10';
    },
    /spacing\s+pad\s+0,10,0,10/,
  ],
  'a wrong gap': [
    (t) => {
      t.layout.gap = 16;
    },
    /spacing\s+gap\s+16/,
  ],
  'the wrong colour token': [
    (t) => {
      kid(t, 'Large').fill.token = 'Background/Secondary';
    },
    /paint\s+fill\s+Background\/Secondary/,
  ],
  'the wrong text style': [
    (t) => {
      kid(t, 'Medium').children[0].text.style = 'Body/Base';
    },
    /type\s+style\s+Body\/Base/,
  ],
  'a wrong line height': [
    (t) => {
      kid(t, 'Large').children[0].text.lineHeight = '20px';
    },
    /type\s+line height\s+20px/,
  ],
  'a wrong corner radius': [
    (t) => {
      kid(t, 'Small').radius = 4;
    },
    /paint\s+radius\s+4\/4\/4\/4/,
  ],
  'the wrong order': [
    (t) => {
      t.children.reverse();
    },
    /order\s+left to right\s+Large › Medium › Small/,
  ],
  'a layer the code is missing': [
    (t) => {
      kid(t, 'Medium').children.push({
        name: 'Badge',
        type: 'FRAME',
        w: 8,
        h: 8,
      });
    },
    /presence\s+layer.*UNACCOUNTED/,
  ],
  'a border the design does not have': [
    (t) => {
      kid(t, 'Small').stroke = { hex: '#000000' };
      kid(t, 'Small').strokeWeight = 2;
    },
    /paint\s+stroke width\s+2,2,2,2/,
  ],
};

for (const [name, [change, expected]] of Object.entries(MISTAKES)) {
  test(`catches ${name}`, async () => {
    const { code, out } = await audit(change);
    assert.equal(code, 1, out);
    const rows = failing(out);
    assert.ok(
      rows.some((row) => expected.test(row)),
      `expected a failing row like ${expected}, got:\n${rows.join('\n')}`,
    );
  });
}
