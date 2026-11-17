import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '#lib/utils';

type DivProps = useRender.ComponentProps<'div'>;

/* Fills the space where content would be, and says what to do about it. */
export function Root({ render, className, ...props }: DivProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        className: cn(
          'flex flex-col items-center gap-4 px-6 py-12 text-center',
          className,
        ),
      },
      props,
    ),
  });
}

/* Holds one icon, drawn large on a soft circle. */
export function Media({ render, className, ...props }: DivProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        'aria-hidden': true,
        className: cn(
          'bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full [&_svg]:size-6',
          className,
        ),
      },
      props,
    ),
  });
}

/* A heading by default; pick the level that fits the page with `render`. */
export function Title({
  render,
  className,
  ...props
}: useRender.ComponentProps<'h2'>) {
  return useRender({
    defaultTagName: 'h2',
    render,
    props: mergeProps<'h2'>(
      { className: cn('type-heading-4 text-foreground', className) },
      props,
    ),
  });
}

export function Description({
  render,
  className,
  ...props
}: useRender.ComponentProps<'p'>) {
  return useRender({
    defaultTagName: 'p',
    render,
    props: mergeProps<'p'>(
      {
        className: cn(
          'type-body-sm text-muted-foreground max-w-sm text-balance',
          className,
        ),
      },
      props,
    ),
  });
}

export function Actions({ render, className, ...props }: DivProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        className: cn(
          'flex flex-wrap items-center justify-center gap-2',
          className,
        ),
      },
      props,
    ),
  });
}
