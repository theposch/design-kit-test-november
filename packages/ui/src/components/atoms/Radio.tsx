import { Radio as BaseRadio } from '@base-ui/react/radio';

import { focusRingBordered } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root({ className, ...props }: Stringly<BaseRadio.Root.Props>) {
  return (
    <BaseRadio.Root
      className={cn(
        focusRingBordered,
        'border-input bg-background text-primary-foreground ease-default data-checked:border-primary data-checked:bg-primary data-invalid:border-destructive inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-(--motion-hover-duration) outline-none data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function Indicator({
  className,
  ...props
}: Stringly<BaseRadio.Indicator.Props>) {
  return (
    <BaseRadio.Indicator
      className={cn('size-1.5 rounded-full bg-current', className)}
      {...props}
    />
  );
}
