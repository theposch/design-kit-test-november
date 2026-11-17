// pnpm new-prototype <name> — a new exploration set up for the prototype
// viewer: @repo/ui wired, a prototype.json listing its screens, and a
// screen per #hash so the viewer can open any of them.

import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import { projectScreens } from '../../packages/ui/scripts/lib/project.mjs';
import { explorationsDir, fail, repoRoot, run } from '../explorations/lib.mjs';

const name = process.argv[2];
if (!name || name.startsWith('-')) fail('usage: pnpm new-prototype <name>');

const made = run('node', [
  path.join(repoRoot, 'scripts/explorations/new.mjs'),
  name,
  '--with-ui',
]);
if (made.status !== 0) process.exit(made.status ?? 1);

const dest = path.join(explorationsDir, name);
const overlay = path.join(explorationsDir, '.templates', 'prototype');
cpSync(overlay, dest, { recursive: true });

// only the files the overlay brought in (node_modules is in there by now)
const stamp = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const from = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stamp(from);
      continue;
    }
    const file = path.join(dest, path.relative(overlay, from));
    const text = readFileSync(file, 'utf8');
    if (text.includes('__NAME__'))
      writeFileSync(file, text.replaceAll('__NAME__', name));
  }
};
stamp(overlay);

if (!existsSync(path.join(dest, 'prototype.json')))
  fail(
    'The prototype template is missing. Run: pnpm addon add prototype-viewer',
  );

/* A desktop-only project starts its prototypes on the desktop frame. */
const { screens } = projectScreens();
if (!screens.includes('phone')) {
  const file = path.join(dest, 'prototype.json');
  const prototype = JSON.parse(readFileSync(file, 'utf8'));
  writeFileSync(
    file,
    `${JSON.stringify({ ...prototype, device: 'desktop' }, null, 2)}\n`,
  );
}

console.log(`
It's a prototype: explorations/${name}/prototype.json lists its screens,
and src/App.tsx has one block per screen.

  pnpm present    # see it in the viewer, on this computer

Merging to main publishes it. Clients only see it once someone
switches it on in the viewer's Prototypes panel.`);
