import { Input as BaseInput } from '@base-ui/react/input';
import { cva, type VariantProps } from 'class-variance-authority';

import { focusRingBordered } from '#lib/focusRing';
import { cn } from '#lib/utils';

/*
 * The size ladder matches Button's control heights so an input and a button
 * placed side by side line up at every rung.
 */
const inputVariants = cva(
  [
    focusRingBordered,
    'w-full min-w-0 rounded-lg border border-input bg-background text-foreground transition-colors duration-(--motion-hover-duration) ease-default outline-none placeholder:text-muted-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-invalid:border-destructive data-invalid:ring-destructive aria-invalid:border-destructive aria-invalid:ring-destructive',
  ],
  {
    variants: {
      /* Phones get 16px text: iOS Safari zooms into any field set smaller. */
      size: {
        sm: 'h-8 px-2.5 type-body-base tablet:type-body-xs',
        md: 'h-10 px-3 type-body-base tablet:type-body-sm',
        lg: 'h-12 px-4 type-body-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

type InputProps = Omit<BaseInput.Props, 'className' | 'size'> &
  VariantProps<typeof inputVariants> & {
    /*
     * Base UI also accepts a state-callback form of `className`, but cn()
     * flattens through clsx, which silently discards function values — the
     * styled layer admits only strings so that footgun can't compile.
     */
    className?: string;
  };

export function Input({ className, size, ...props }: InputProps) {
  return (
    <BaseInput className={cn(inputVariants({ size, className }))} {...props} />
  );
}
