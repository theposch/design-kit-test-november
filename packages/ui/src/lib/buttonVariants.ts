import { focusRingBordered } from '#lib/focusRing';
import { cva, type VariantProps } from 'class-variance-authority';

/*
 * Shared by `Button` and `LinkButton` so a link that looks like a button gets
 * Button's look without borrowing Button's semantics. It lives outside the
 * component files because `react-refresh/only-export-components` rejects a
 * non-component export next to a component.
 */
export const buttonVariants = cva(
  [
    focusRingBordered,
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent whitespace-nowrap transition-colors duration-(--motion-hover-duration) ease-default outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border-border bg-background text-foreground hover:bg-muted aria-expanded:bg-muted',
        ghost: 'text-foreground hover:bg-muted aria-expanded:bg-muted',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-8 px-3 type-label-xs [&_svg]:size-3.5',
        md: 'h-10 px-4 type-label-sm [&_svg]:size-4',
        lg: 'h-12 px-5 type-label-base [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
