import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

import {
  explorationsDir,
  fail,
  reservedSiteName,
  run,
  SITE_NAME_RULE,
  sitesProject,
} from './lib.mjs';

const args = process.argv.slice(2);
const withUi = args.includes('--with-ui');
const name = args.find((arg) => !arg.startsWith('-'));
const unknown = args.filter(
  (arg) => arg.startsWith('-') && arg !== '--with-ui',
);

if (!name || unknown.length > 0) {
  fail(
    'usage: pnpm new-exploration <name> [--with-ui]\n\n' +
      '  --with-ui  pre-wire @repo/ui and the token theme',
  );
}
if (!SITE_NAME_RULE.test(name)) {
  fail(
    `"${name}" is not a valid exploration name.\n` +
      'The folder name doubles as the Metalab site name: lowercase letters,\n' +
      'numbers, and hyphens only, starting with a letter or number.',
  );
}
const reserved = reservedSiteName(name);
if (reserved) fail(reserved);

const dest = path.join(explorationsDir, name);
if (existsSync(dest)) fail(`explorations/${name} already exists.`);

const template = path.join(
  explorationsDir,
  '.templates',
  withUi ? 'with-ui' : 'blank',
);
cpSync(template, dest, { recursive: true });
renameSync(
  path.join(dest, 'package.json.tpl'),
  path.join(dest, 'package.json'),
);

const stampName = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stampName(file);
    } else {
      const content = readFileSync(file, 'utf8');
      if (content.includes('__NAME__')) {
        writeFileSync(file, content.replaceAll('__NAME__', name));
      }
    }
  }
};
stampName(dest);

const install = run('pnpm', ['install']);
if (install.status !== 0) fail('pnpm install failed — see output above.');

const project = sitesProject();
console.log(`
Created explorations/${name} (${withUi ? 'with @repo/ui wired' : 'blank'}).

  pnpm --filter @explorations/${name} dev    # local dev server
  pnpm publish-exploration ${name}           # publish your draft site

Merging to main deploys the canonical site${
  project ? `: https://sites.metalab.com/${project}/${name}/` : '.'
}
See explorations/README.md for the full picture.`);
