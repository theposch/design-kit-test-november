import { Progress as BaseProgress } from '@base-ui/react/progress';

import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * A two-column grid: Label and Value share the first row, the Track spans
 * the second. Leave out Label or Value and the layout still holds.
 */
export function Root({
  className,
  ...props
}: Stringly<BaseProgress.Root.Props>) {
  return (
    <BaseProgress.Root
      className={cn('grid w-full grid-cols-2 gap-y-2', className)}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: Stringly<BaseProgress.Label.Props>) {
  return (
    <BaseProgress.Label
      className={cn('type-label-sm text-foreground', className)}
      {...props}
    />
  );
}

export function Value({
  className,
  ...props
}: Stringly<BaseProgress.Value.Props>) {
  return (
    <BaseProgress.Value
      className={cn(
        'type-body-sm text-muted-foreground col-start-2 text-right tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

export function Track({
  className,
  ...props
}: Stringly<BaseProgress.Track.Props>) {
  return (
    <BaseProgress.Track
      className={cn(
        'bg-muted col-span-2 h-2 overflow-hidden rounded-full',
        className,
      )}
      {...props}
    />
  );
}

export function Indicator({
  className,
  ...props
}: Stringly<BaseProgress.Indicator.Props>) {
  return (
    <BaseProgress.Indicator
      className={cn(
        'bg-primary ease-default block h-full rounded-full transition-[width] duration-(--motion-duration-slow) data-indeterminate:w-full data-indeterminate:motion-safe:animate-pulse',
        className,
      )}
      {...props}
    />
  );
}
