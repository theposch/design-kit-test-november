#!/usr/bin/env node
/*
 * Saves an extractor run as a snapshot, so nobody pastes 500 lines by hand.
 *
 *   pnpm figma:snapshot <slug> <file>   file: what figma_execute returned or saved
 *   pnpm figma:snapshot <slug> -        read it from standard input
 *
 * The tool's output may be the snapshot itself, or wrapped in a result object,
 * or JSON inside a string. The snapshot is the object carrying `_meta.schemaVersion`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PACKAGE } from '../lib/storybook.mjs';
import { findSnapshot } from './lib.mjs';

const argv = process.argv.slice(2);
const [slug, file] = argv.filter(
  (a, i) => (a === '-' || !a.startsWith('--')) && argv[i - 1] !== '--specs',
);
const specsFlag = process.argv.indexOf('--specs');
const specsDir = path.resolve(
  specsFlag === -1
    ? path.join(PACKAGE, 'figma', 'specs')
    : process.argv[specsFlag + 1],
);

if (!slug || !file) {
  console.error('\nUsage: pnpm figma:snapshot <slug> <file | ->\n');
  process.exit(1);
}

/* pnpm --filter runs this inside packages/ui; a path typed at the repo root resolves from there. */
const raw = readFileSync(
  file === '-' ? 0 : path.resolve(process.env.INIT_CWD ?? process.cwd(), file),
  'utf8',
);
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  parsed = raw;
}
const snapshot = findSnapshot(parsed);
if (!snapshot) {
  console.error(
    '\nNo snapshot found in that file. It should hold what extract.js returned.\n',
  );
  process.exit(1);
}
if (snapshot._meta.slug && snapshot._meta.slug !== slug)
  console.warn(
    `Note: the run was named "${snapshot._meta.slug}"; saving it as "${slug}".`,
  );

mkdirSync(specsDir, { recursive: true });
const out = path.join(specsDir, `${slug}.json`);
/* Formatted the way the repo's prettier would, so a format check doesn't trip on it. */
let text = `${JSON.stringify(snapshot, null, 2)}\n`;
try {
  const prettier = await import('prettier');
  text = await prettier.format(text, {
    ...(await prettier.resolveConfig(out)),
    filepath: out,
  });
} catch {
  /* prettier missing: plain JSON is still valid */
}
writeFileSync(out, text);

const warnings = snapshot.warnings ?? [];
console.log(
  `\nSaved ${path.relative(process.cwd(), out)}: ${snapshot.nodes?.length ?? 0} frame(s), ${snapshot.sets?.length ?? 0} set(s), from "${snapshot._meta.fileName}".`,
);
if (warnings.length) {
  console.log('Warnings, one decision each in FIGMA.md:');
  for (const w of warnings)
    console.log(
      typeof w === 'string'
        ? `  ! ${w}`
        : `  ! ${w.kind} ×${w.count}: ${w.message}`,
    );
}
console.log(
  snapshot.sets?.length
    ? `Next: pnpm figma:audit ${slug} --layers\n`
    : `Next, for screens: pnpm figma:health ${slug}, then pnpm figma:survey ${slug} (with 3–5 screens), or pnpm figma:screen ${slug} once it's built.\n`,
);
