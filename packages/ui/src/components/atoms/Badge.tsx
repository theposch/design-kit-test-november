import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#lib/utils';

const badgeVariants = cva(
  'type-label-xs inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        neutral: 'bg-muted text-foreground',
        info: 'bg-info-subtle text-info-subtle-foreground',
        success: 'bg-success-subtle text-success-subtle-foreground',
        warning: 'bg-warning-subtle text-warning-subtle-foreground',
        destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

type BadgeProps = useRender.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>;

/* A short status label. The words carry the meaning; the colour only backs them up. */
export function Badge({ render, className, variant, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: 'span',
    render,
    props: mergeProps<'span'>(
      { className: cn(badgeVariants({ variant }), className) },
      props,
    ),
  });
}
