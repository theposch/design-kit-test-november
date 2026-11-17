import { Switch as BaseSwitch } from '@base-ui/react/switch';

import { focusRingBordered } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root({ className, ...props }: Stringly<BaseSwitch.Root.Props>) {
  return (
    <BaseSwitch.Root
      className={cn(
        focusRingBordered,
        'bg-input ease-default data-checked:bg-primary data-invalid:border-destructive inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent p-0.5 transition-colors duration-(--motion-duration-fast) outline-none data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function Thumb({
  className,
  ...props
}: Stringly<BaseSwitch.Thumb.Props>) {
  return (
    <BaseSwitch.Thumb
      className={cn(
        'bg-background ease-default data-checked:bg-primary-foreground block size-3.5 rounded-full shadow-sm transition-transform duration-(--motion-duration-fast) data-checked:translate-x-4',
        className,
      )}
      {...props}
    />
  );
}
