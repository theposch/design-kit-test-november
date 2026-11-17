import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/*
 * design.tokens.json is the theme CSS in the shared token format, for Figma and
 * other tools. It is generated, so it must never fall behind the CSS: a token
 * changed here and not regenerated would reach Figma with the old value.
 */
describe('design.tokens.json', () => {
  it('matches the theme CSS (run `pnpm tokens` to update it)', () => {
    const script = fileURLToPath(
      new URL('../../scripts/tokens.mjs', import.meta.url),
    );
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' }),
    ).not.toThrow();
  });
});
