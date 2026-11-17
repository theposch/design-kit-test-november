import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '#lib/utils';

/* A key or shortcut to press, such as ⌘K or Enter. */
export function Kbd({
  render,
  className,
  ...props
}: useRender.ComponentProps<'kbd'>) {
  return useRender({
    defaultTagName: 'kbd',
    render,
    props: mergeProps<'kbd'>(
      {
        className: cn(
          'type-body-xs border-border bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-sm border px-1 whitespace-nowrap',
          className,
        ),
      },
      props,
    ),
  });
}
