import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/*
 * The browser test runner can't produce a real pointer hover, so stories
 * can't catch a `hover:` that outranks state classes. This pins the rule
 * instead: the disabled guard must add no specificity.
 */
const css = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
const variant = /@custom-variant hover\s*\{([\s\S]*?)@slot/.exec(css)?.[1];

describe('hover variant', () => {
  it('is defined', () => {
    expect(variant).toBeDefined();
  });

  it('keeps the disabled guard inside :where()', () => {
    expect(variant).toMatch(/&:hover:where\(:not\(/);
    expect(variant).not.toMatch(/&:hover:not\(/);
  });
});
