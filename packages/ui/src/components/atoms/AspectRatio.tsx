import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#lib/utils';

/* The child (usually an image) fills the box and is cropped to the shape. */
const aspectRatioVariants = cva(
  'relative w-full overflow-hidden *:size-full *:object-cover',
  {
    variants: {
      ratio: {
        '1/1': 'aspect-square',
        '16/9': 'aspect-video',
        '3/2': 'aspect-3/2',
        '4/3': 'aspect-4/3',
        '3/4': 'aspect-3/4',
        '4/5': 'aspect-4/5',
        '9/16': 'aspect-9/16',
      },
    },
    defaultVariants: { ratio: '16/9' },
  },
);

type AspectRatioProps = useRender.ComponentProps<'div'> &
  VariantProps<typeof aspectRatioVariants>;

export function AspectRatio({
  render,
  className,
  ratio,
  ...props
}: AspectRatioProps) {
  return useRender({
    defaultTagName: 'div',
    render,
    props: mergeProps<'div'>(
      { className: cn(aspectRatioVariants({ ratio }), className) },
      props,
    ),
  });
}
