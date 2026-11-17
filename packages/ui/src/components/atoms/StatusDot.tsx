import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#lib/utils';

const dotVariants = cva('inline-block size-2 shrink-0 rounded-full', {
  variants: {
    tone: {
      neutral: 'bg-muted-foreground',
      info: 'bg-info-subtle-foreground',
      success: 'bg-success-subtle-foreground',
      warning: 'bg-warning-subtle-foreground',
      destructive: 'bg-destructive-subtle-foreground',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

type StatusDotProps = VariantProps<typeof dotVariants> & {
  /**
   * What the dot means, for screen readers ("Online"). Leave it out when
   * text next to the dot already says it.
   */
  label?: string;
  className?: string;
};

/* A small coloured dot for presence or health, always beside words that say the same. */
export function StatusDot({ tone, label, className }: StatusDotProps) {
  return (
    <span
      aria-hidden={label === undefined}
      aria-label={label}
      role={label === undefined ? undefined : 'img'}
      className={cn(dotVariants({ tone }), className)}
    />
  );
}
