import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/*
 * CLAUDE.md's "Which component?" table is how an agent picks a component, so
 * it must never fall behind the library: a component with no row is one
 * nobody reaches for, and a row edited by hand is lost on the next run.
 */
describe('the "Which component?" table', () => {
  it('names every component and matches the stories (run `pnpm guide` to update it)', () => {
    const script = fileURLToPath(
      new URL('../scripts/guide.mjs', import.meta.url),
    );
    let output = '';
    try {
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' });
    } catch (error) {
      output = String((error as { stderr?: Buffer }).stderr ?? error);
    }
    expect(output).toBe('');
  });
});
