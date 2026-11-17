import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#lib/utils';

const centerVariants = cva('flex min-w-0 flex-col', {
  variants: {
    axis: {
      both: 'items-center justify-center',
      horizontal: 'items-center',
      vertical: 'justify-center',
    },
    /* How tall the area to centre within is. */
    height: {
      content: '',
      parent: 'min-h-full',
      screen: 'min-h-dvh',
    },
  },
  defaultVariants: { axis: 'both', height: 'content' },
});

type CenterProps = useRender.ComponentProps<'div'> &
  VariantProps<typeof centerVariants>;

export function Center({
  render,
  className,
  axis,
  height,
  ...props
}: CenterProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      { className: cn(centerVariants({ axis, height }), className) },
      props,
    ),
  });
}
