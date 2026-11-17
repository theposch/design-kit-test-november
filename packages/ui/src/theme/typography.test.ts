import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./typography.css', import.meta.url), 'utf8');

/*
 * A type style is only swap-proof if it owns every axis a font change moves.
 * One it leaves out falls back to whatever the page inherits, so a brand font
 * retunes some styles and silently skips that one.
 */
const AXES = [
  'font-family',
  'font-size',
  'line-height',
  'font-weight',
  'letter-spacing',
];

const styles = [
  ...css.matchAll(
    /@utility\s+type-((?:body|label|heading)-[a-z0-9]+)\s*\{([^}]*)\}/g,
  ),
].map(([, name, body]) => ({ name, body }));

describe('type styles', () => {
  it('finds the styles to check', () => {
    expect(styles.length).toBeGreaterThan(0);
  });

  for (const { name, body } of styles) {
    it(`type-${name} sets all five axes from its own variables`, () => {
      const declared = [...body.matchAll(/([a-z-]+)\s*:\s*([^;]+);/g)];
      const props = declared.map(([, prop]) => prop);
      expect(props).toEqual(expect.arrayContaining(AXES));
      for (const [, prop, value] of declared) {
        if (AXES.includes(prop)) {
          expect(value, `${prop} in type-${name}`).toMatch(/^var\(--/);
        }
      }
    });
  }
});
