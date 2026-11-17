import { afterEach, beforeEach, expect, vi } from 'vitest';

/*
 * A React key warning, a Base UI misuse warning or a failed prop type only
 * reaches the console, where no assertion sees it. Collecting them here
 * turns each one into a failed story.
 */
const logged: string[] = [];

beforeEach(() => {
  logged.length = 0;
  for (const level of ['error', 'warn'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logged.push(`console.${level}: ${args.map(String).join(' ')}`);
    });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  expect(logged, 'The story logged to the console').toEqual([]);
});
