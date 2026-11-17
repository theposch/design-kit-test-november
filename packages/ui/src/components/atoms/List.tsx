import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '#lib/utils';

/*
 * Rows of like items with a rule between them: order lines, files, people.
 * A row reads start to end: something visual (Thumbnail, Avatar, Icon), then
 * List.Content with a title and description, then List.End for figures or
 * actions.
 */
export function Root({
  render,
  className,
  ...props
}: useRender.ComponentProps<'ul'>) {
  return useRender({
    defaultTagName: 'ul',
    render,
    props: mergeProps<'ul'>(
      { className: cn('divide-border flex flex-col divide-y', className) },
      props,
    ),
  });
}

export function Item({
  render,
  className,
  ...props
}: useRender.ComponentProps<'li'>) {
  return useRender({
    defaultTagName: 'li',
    render,
    props: mergeProps<'li'>(
      { className: cn('flex items-center gap-3 py-3', className) },
      props,
    ),
  });
}

type DivProps = useRender.ComponentProps<'div'>;

export function Content({ render, className, ...props }: DivProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      { className: cn('flex min-w-0 flex-1 flex-col gap-0.5', className) },
      props,
    ),
  });
}

export function Title({
  render,
  className,
  ...props
}: useRender.ComponentProps<'p'>) {
  return useRender({
    defaultTagName: 'p',
    render,
    props: mergeProps<'p'>(
      {
        className: cn('type-label-sm text-foreground truncate', className),
      },
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
      { className: cn('type-body-sm text-muted-foreground', className) },
      props,
    ),
  });
}

export function End({ render, className, ...props }: DivProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      {
        className: cn(
          'flex shrink-0 flex-col items-end gap-0.5 text-end',
          className,
        ),
      },
      props,
    ),
  });
}
