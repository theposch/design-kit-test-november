import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '#lib/utils';

/*
 * Label and value pairs, like an order summary or a customer record. It
 * measures its own width, not the window's: in a narrow side panel the label
 * sits above its value, in wide content they share a row.
 */
export function Root({
  render,
  className,
  ...props
}: useRender.ComponentProps<'dl'>) {
  return useRender({
    defaultTagName: 'dl',
    render,
    props: mergeProps<'dl'>(
      { className: cn('@container flex flex-col', className) },
      props,
    ),
  });
}

export function Item({
  render,
  className,
  ...props
}: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        className: cn(
          'type-body-sm flex flex-col gap-1 py-2 @md:flex-row @md:gap-4',
          className,
        ),
      },
      props,
    ),
  });
}

export function Term({
  render,
  className,
  ...props
}: useRender.ComponentProps<'dt'>) {
  return useRender({
    defaultTagName: 'dt',
    render,
    props: mergeProps<'dt'>(
      {
        className: cn('text-muted-foreground shrink-0 @md:w-40', className),
      },
      props,
    ),
  });
}

export function Value({
  render,
  className,
  ...props
}: useRender.ComponentProps<'dd'>) {
  return useRender({
    defaultTagName: 'dd',
    render,
    props: mergeProps<'dd'>(
      { className: cn('text-foreground min-w-0 flex-1', className) },
      props,
    ),
  });
}
