import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * Exported so `utils.test.ts` can assert they still mirror the composites in
 * `src/theme/typography.css`. A rung added there but missed here degrades
 * `cn()`: an unmirrored `text-*` size token is misread as a color (and drops
 * real colors on merge), and an unmirrored `type-*` composite stops
 * conflicting with its siblings.
 */
export const TYPE_SIZE_TOKENS = [
  'body-xs',
  'body-sm',
  'body-base',
  'body-lg',
  'label-xs',
  'label-sm',
  'label-base',
  'heading-1',
  'heading-2',
  'heading-3',
  'heading-4',
];

/*
 * Composites that change one part of a style (`type-strong` sets the weight)
 * and so must not conflict with the full styles above.
 */
export const TYPE_MODIFIERS = ['strong'];

/*
 * tailwind-merge only knows Tailwind's default theme. Without registration it
 * classifies the typography tokens (`text-body-*`, `text-heading-*`) as text
 * *colors*, so merging `text-primary-foreground text-body-xs` would drop the
 * color class. Register the size tokens in the font-size group, the family
 * tokens in font-family, and the `type-*` composites as a group of their own,
 * so each only conflicts with its own kind.
 */
const twMerge = extendTailwindMerge<'type-style' | 'type-modifier'>({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPE_SIZE_TOKENS }],
      'font-family': [{ font: ['body', 'heading'] }],
      'type-style': [{ type: TYPE_SIZE_TOKENS }],
      'type-modifier': [{ type: TYPE_MODIFIERS }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
