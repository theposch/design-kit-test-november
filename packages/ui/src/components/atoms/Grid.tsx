import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import type { CSSProperties } from 'react';

import { gapClasses, type Gap } from '#lib/gapClasses';
import { cn } from '#lib/utils';

const gridVariants = cva('grid min-w-0', {
  variants: {
    align: {
      stretch: 'items-stretch',
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
    },
  },
  defaultVariants: { align: 'stretch' },
});

const fixedColumnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  12: 'grid-cols-12',
} as const;

/** The narrowest a column may get before the grid drops one, in px. */
type MinWidth = 160 | 200 | 240 | 280 | 320 | 360 | 400;

type Columns =
  | keyof typeof fixedColumnClasses
  | {
      minWidth: MinWidth;
      max?: 2 | 3 | 4 | 5 | 6;
      /** With fewer items than fit, widen them to fill the row. */
      stretch?: boolean;
    };

type GridProps = useRender.ComponentProps<'div'> &
  VariantProps<typeof gridVariants> & {
    /**
     * A number gives exactly that many columns at every size; keep it for
     * rows that must never reflow, such as a seven-day week. An object
     * reflows: as many columns as fit at `minWidth` or wider, up to `max`,
     * down to one column on a phone.
     */
    columns: Columns;
    /** Space between cells, in 4px steps: 2 is 8px, 4 is 16px. */
    gap?: Gap;
  };

/*
 * Each column is at least `minWidth` and at most a 1/max share of the row, so
 * the count steps down as the container narrows. min(100%, …) keeps a single
 * column from overflowing a phone narrower than `minWidth`.
 */
function reflowingColumns(
  minWidth: MinWidth,
  max: number | undefined,
  stretch: boolean,
  gap: Gap,
): CSSProperties {
  const min = `${minWidth / 16}rem`;
  const track =
    max === undefined
      ? `min(100%, ${min})`
      : `min(100%, max(${min}, (100% - ${max - 1} * var(--spacing) * ${gap}) / ${max}))`;
  return {
    '--grid-columns': `repeat(${stretch ? 'auto-fit' : 'auto-fill'}, minmax(${track}, 1fr))`,
  } as CSSProperties;
}

export function Grid({
  render,
  className,
  style,
  align,
  columns,
  gap = 0,
  ...props
}: GridProps) {
  const reflows = typeof columns === 'object';
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        className: cn(
          gridVariants({ align }),
          gapClasses[gap],
          reflows ? 'grid-cols-(--grid-columns)' : fixedColumnClasses[columns],
          className,
        ),
        style: reflows
          ? {
              ...reflowingColumns(
                columns.minWidth,
                columns.max,
                columns.stretch ?? false,
                gap,
              ),
              ...style,
            }
          : style,
      },
      props,
    ),
  });
}
