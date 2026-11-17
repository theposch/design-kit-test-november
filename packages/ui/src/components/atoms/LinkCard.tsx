import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

const linkCardVariants = cva(
  [
    focusRing,
    'text-foreground ease-default flex min-w-0 flex-col overflow-hidden rounded-xl transition-colors duration-(--motion-hover-duration) outline-none',
  ],
  {
    variants: {
      /* `ghost` has no frame until hover, for dense grids of links. */
      variant: {
        surface: 'bg-surface border-border hover:bg-muted border',
        ghost: 'hover:bg-muted p-2',
      },
    },
    defaultVariants: { variant: 'surface' },
  },
);

type LinkCardProps = useRender.ComponentProps<'a'> &
  VariantProps<typeof linkCardVariants>;

/*
 * A whole card that is one link, to the item's own page. Swap in a router
 * link with `render`. Keep buttons and other links out of it: a link can't
 * hold other controls.
 */
export function LinkCard({
  render,
  className,
  variant,
  ...props
}: LinkCardProps) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      { className: cn(linkCardVariants({ variant }), className) },
      props,
    ),
  });
}
