import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#lib/utils';

const textVariants = cva('', {
  variants: {
    register: {
      'body-xs': 'type-body-xs',
      'body-sm': 'type-body-sm',
      'body-base': 'type-body-base',
      'body-lg': 'type-body-lg',
      /* Names a group of controls, such as the question over a set of options. */
      'label-sm': 'type-label-sm',
    },
    /* `inherit` takes the colour of the surface it sits on. */
    tone: {
      inherit: '',
      muted: 'text-muted-foreground',
      destructive: 'text-destructive',
    },
    align: {
      start: 'text-start',
      center: 'text-center',
      end: 'text-end',
    },
    /* Cut long text off after this many lines, with an ellipsis. */
    lines: {
      all: '',
      '1': 'truncate',
      '2': 'line-clamp-2',
      '3': 'line-clamp-3',
    },
  },
  defaultVariants: {
    register: 'body-base',
    tone: 'inherit',
    align: 'start',
    lines: 'all',
  },
});

type TextProps = useRender.ComponentProps<'p'> &
  VariantProps<typeof textVariants> & {
    /** Even out line lengths, so a short last line doesn't dangle. */
    balance?: boolean;
    /** The strong weight, for figures such as prices. Not a heading. */
    strong?: boolean;
  };

export function Text({
  render,
  className,
  register,
  tone,
  align,
  lines,
  balance = false,
  strong = false,
  ...props
}: TextProps) {
  return useRender({
    defaultTagName: 'p',
    render,
    props: mergeProps<'p'>(
      {
        className: cn(
          textVariants({ register, tone, align, lines }),
          balance && 'text-balance',
          strong && 'type-strong',
          className,
        ),
      },
      props,
    ),
  });
}
