import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#lib/utils';

const headingVariants = cva('', {
  variants: {
    register: {
      'heading-1': 'type-heading-1',
      'heading-2': 'type-heading-2',
      'heading-3': 'type-heading-3',
      'heading-4': 'type-heading-4',
    },
    tone: {
      inherit: '',
      muted: 'text-muted-foreground',
    },
    align: {
      start: 'text-start',
      center: 'text-center',
      end: 'text-end',
    },
  },
  defaultVariants: { tone: 'inherit', align: 'start' },
});

type Level = 1 | 2 | 3 | 4 | 5 | 6;

/* Each level's default look; `register` overrides it without changing the outline. */
const LOOK = {
  1: 'heading-1',
  2: 'heading-2',
  3: 'heading-3',
  4: 'heading-4',
  5: 'heading-4',
  6: 'heading-4',
} as const;

type HeadingProps = useRender.ComponentProps<'h2'> &
  VariantProps<typeof headingVariants> & {
    /**
     * Where the heading sits in the page outline (h1 to h6). Pick it for the
     * structure; pick `register` for the look.
     */
    level: Level;
  };

export function Heading({
  render,
  className,
  level,
  register,
  tone,
  align,
  ...props
}: HeadingProps) {
  return useRender({
    defaultTagName: `h${level}`,
    render,
    props: mergeProps<'h2'>(
      {
        className: cn(
          headingVariants({ register: register ?? LOOK[level], tone, align }),
          className,
        ),
      },
      props,
    ),
  });
}
