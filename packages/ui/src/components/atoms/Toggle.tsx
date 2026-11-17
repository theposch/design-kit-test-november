import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

/*
 * A control, so it carries the same height ladder as Button. Pressed state
 * uses the secondary pair, a fill rather than a hue shift, so it still reads
 * for people who can't tell the colours apart.
 */
const toggleVariants = cva(
  [
    focusRing,
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-foreground transition-colors duration-(--motion-hover-duration) ease-default outline-none select-none hover:bg-muted data-disabled:pointer-events-none data-disabled:opacity-50 data-pressed:bg-secondary data-pressed:text-secondary-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 min-w-8 px-2 type-label-xs [&_svg]:size-3.5',
        md: 'h-10 min-w-10 px-2.5 type-label-sm [&_svg]:size-4',
        lg: 'h-12 min-w-12 px-3 type-label-base [&_svg]:size-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

type ToggleProps = Omit<BaseToggle.Props, 'className'> &
  VariantProps<typeof toggleVariants> & { className?: string };

export function Toggle({ className, size, ...props }: ToggleProps) {
  return (
    <BaseToggle
      className={cn(toggleVariants({ size, className }))}
      {...props}
    />
  );
}
