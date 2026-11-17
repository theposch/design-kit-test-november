import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

/*
 * Add-ons ship into every client project, so none may name a client or a
 * reference project. The names are stored as SHA-256 hashes so this file
 * doesn't name them either. To add one:
 *   printf %s name | shasum -a 256
 */
const BANNED = new Set([
  'b0c5fbfcb887122f06c7655a0bf7c8df1ddbed8ef3215140916595409b0d5ae4',
  '20c01704f3d08a0fbe44c2965815ff26bba63f0c556a3710924f62bf1b03679e',
  'b7981efc2c57a373f0dd394720f6135e9f1b9c50e6b6a71bc5673744eb62eacd',
  '63aa9bc77bb23e9f3cbfc65d619624bdb1e7bd261ef8c6883767b5046227ef0c',
  '326f5b47c73922d70eb358f519468e1f70a3c0ebfd41e469b5291ac59d9bbb99',
]);

const CATALOG = path.resolve(import.meta.dirname, '..', '..', 'add-ons');
const TEXT = /\.(md|mjs|js|ts|tsx|json|css|html|txt)$/;

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else if (TEXT.test(entry.name)) yield full;
  }
}

test('no add-on names a client or a reference project', () => {
  const found = [];
  for (const file of files(CATALOG)) {
    const words = new Set(
      readFileSync(file, 'utf8')
        .toLowerCase()
        .match(/[a-z0-9]+/g),
    );
    for (const word of words) {
      if (BANNED.has(createHash('sha256').update(word).digest('hex'))) {
        found.push(`${path.relative(CATALOG, file)}: "${word}"`);
      }
    }
  }
  assert.deepEqual(
    found,
    [],
    `Client names in the catalog:\n${found.join('\n')}`,
  );
});
