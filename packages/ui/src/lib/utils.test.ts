import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { cn, TYPE_MODIFIERS, TYPE_SIZE_TOKENS } from './utils';

/*
 * Read off disk, not via an `import ... ?raw`: the Tailwind Vite plugin compiles
 * any `.css` it sees, which would strip the `@utility` / `@theme` source this
 * test parses. `fs` bypasses the module pipeline and gets the raw source.
 */
const typographyCss = readFileSync(
  new URL('../theme/typography.css', import.meta.url),
  'utf8',
);

/*
 * The typography contract lives in two files that MUST agree: the composites
 * and `--text-*` size registrations in `src/theme/typography.css`, and the
 * arrays in `utils.ts` that tell tailwind-merge how to classify them. Add a
 * rung to one and forget the other and `cn('text-primary-foreground',
 * 'text-<rung>')` silently drops the color (see the note in utils.ts) - a bug
 * no story reliably catches, since contrast-over-inherited can still pass axe.
 *
 * No component can host this invariant; it is a build-config agreement between
 * two files, so it lives as a plain unit test - a deliberate exception to
 * "stories are the only tests".
 */

/** The `@utility type-<name>` composite blocks declared in typography.css. */
const composites = [
  ...typographyCss.matchAll(/@utility\s+type-([a-z0-9-]+)/g),
].map((match) => match[1]);

/*
 * The `--text-<name>:` size registrations. The trailing colon is required so a
 * comment mention like `--text-body-lg (18px)` is not miscounted as a
 * registration.
 */
const sizes = [...typographyCss.matchAll(/--text-([a-z0-9-]+)\s*:/g)].map(
  (match) => match[1],
);

const sorted = (list: readonly string[]): string[] => [...list].sort();

describe('typography token registration', () => {
  it('mirrors every typography.css composite in the tailwind-merge groups', () => {
    expect(sorted(composites)).toEqual(
      sorted([...TYPE_SIZE_TOKENS, ...TYPE_MODIFIERS]),
    );
  });

  it('registers every --text-* size token in the font-size group', () => {
    expect(sorted(sizes)).toEqual(sorted(TYPE_SIZE_TOKENS));
  });

  it('keeps a weight modifier alongside a full style', () => {
    expect(cn('type-body-sm', 'type-strong')).toBe('type-body-sm type-strong');
  });
});
