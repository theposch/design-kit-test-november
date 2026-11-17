import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { gapClasses, type Gap } from '#lib/gapClasses';
import { cn } from '#lib/utils';

const stackVariants = cva('flex min-w-0', {
  variants: {
    direction: {
      column: 'flex-col',
      row: 'flex-row',
    },
    align: {
      stretch: 'items-stretch',
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    /* A row that turns into a column on smaller screens. */
    columnBelow: {
      never: '',
      tablet: 'max-tablet:flex-col max-tablet:items-stretch',
      desktop: 'max-desktop:flex-col max-desktop:items-stretch',
    },
  },
  defaultVariants: {
    direction: 'column',
    align: 'stretch',
    justify: 'start',
    columnBelow: 'never',
  },
});

type StackProps = useRender.ComponentProps<'div'> &
  VariantProps<typeof stackVariants> & {
    /** Space between children, in 4px steps: 2 is 8px, 4 is 16px. */
    gap?: Gap;
    /** Let children wrap onto a new line when the row runs out of room. */
    wrap?: boolean;
  };

export function Stack({
  render,
  className,
  direction,
  align,
  justify,
  columnBelow,
  gap = 0,
  wrap = false,
  ...props
}: StackProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        className: cn(
          stackVariants({ direction, align, justify, columnBelow }),
          gapClasses[gap],
          wrap && 'flex-wrap',
          className,
        ),
      },
      props,
    ),
  });
}
