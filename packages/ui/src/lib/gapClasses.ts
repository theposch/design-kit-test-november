/*
 * The gaps layout components accept, keyed by Tailwind spacing step (4px
 * each): multiples of 8px, plus step 1 (4px) for pairing a label with its
 * text. Matches the 8px rule lint applies to templates and apps.
 */
export const gapClasses = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  14: 'gap-14',
  16: 'gap-16',
} as const;

export type Gap = keyof typeof gapClasses;

export const GAPS = Object.keys(gapClasses).map(Number) as Gap[];
