import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#lib/utils';

type PartProps = useRender.ComponentProps<'div'>;

const rootVariants = cva(
  'flex min-w-0 flex-col overflow-hidden rounded-xl border',
  {
    variants: {
      /* `muted` sits back from the page: a hero panel, a comment bubble, an image well. */
      variant: {
        surface: 'bg-surface text-surface-foreground border-border',
        muted: 'bg-muted text-foreground border-transparent',
      },
    },
    defaultVariants: { variant: 'surface' },
  },
);

/*
 * The surface. It has no padding of its own, so media such as an AspectRatio
 * image runs edge to edge; put text inside Card.Body.
 */
export function Root({
  render,
  className,
  variant,
  ...props
}: PartProps & VariantProps<typeof rootVariants>) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        className: cn(rootVariants({ variant }), className),
      },
      props,
    ),
  });
}

export function Body({ render, className, ...props }: PartProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      { className: cn('flex flex-col gap-4 p-6', className) },
      props,
    ),
  });
}
