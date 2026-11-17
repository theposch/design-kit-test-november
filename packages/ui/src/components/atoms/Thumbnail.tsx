import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { cn } from '#lib/utils';

/*
 * A small square picture of an item, cropped to fill. It defaults to
 * `size-12`; set another footprint with a `size-*` class. Give the image
 * inside its own alt text, or alt="" when the row's text already names it.
 */
export function Thumbnail({
  render,
  className,
  ...props
}: useRender.ComponentProps<'span'>) {
  return useRender({
    defaultTagName: 'span',
    render,
    props: mergeProps<'span'>(
      {
        className: cn(
          'bg-muted border-border block size-12 shrink-0 overflow-hidden rounded-md border *:size-full *:object-cover',
          className,
        ),
      },
      props,
    ),
  });
}
