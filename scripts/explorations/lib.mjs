import { existsSync } from 'node:fs';
import path from 'node:path';

import { fail, readJson, repoRoot } from '../sites/lib.mjs';

export * from '../sites/lib.mjs';

export const explorationsDir = path.join(repoRoot, 'explorations');

export function explorationPackage(name) {
  const dir = path.join(explorationsDir, name);
  const manifest = path.join(dir, 'package.json');
  if (!existsSync(manifest)) {
    fail(
      `No exploration at explorations/${name}.\n` +
        `Create one with: pnpm new-exploration ${name}`,
    );
  }
  const pkg = readJson(manifest);
  return {
    dir,
    pkg,
    distDir: path.join(dir, pkg.sites?.dist ?? 'dist'),
    spaFallback: pkg.sites?.spaFallback,
  };
}
