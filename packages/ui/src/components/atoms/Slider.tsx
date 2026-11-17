import { Slider as BaseSlider } from '@base-ui/react/slider';

import { focusRingWithin } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * Same two-column grid as Progress: Label and Value share the first row and
 * the Control spans the second, so the two read as siblings. Disabled dims
 * only the Control; dimming the text too would drop it below AA contrast.
 */
export function Root({ className, ...props }: Stringly<BaseSlider.Root.Props>) {
  return (
    <BaseSlider.Root
      className={cn('grid w-full grid-cols-2 gap-y-1', className)}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: Stringly<BaseSlider.Label.Props>) {
  return (
    <BaseSlider.Label
      className={cn(
        'type-label-sm text-foreground data-disabled:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function Value({
  className,
  ...props
}: Stringly<BaseSlider.Value.Props>) {
  return (
    <BaseSlider.Value
      className={cn(
        'type-body-sm text-muted-foreground col-start-2 text-right tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

export function Control({
  className,
  ...props
}: Stringly<BaseSlider.Control.Props>) {
  return (
    <BaseSlider.Control
      className={cn(
        'col-span-2 flex w-full touch-none items-center py-2 select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function Track({
  className,
  ...props
}: Stringly<BaseSlider.Track.Props>) {
  return (
    <BaseSlider.Track
      className={cn('bg-muted h-2 w-full rounded-full select-none', className)}
      {...props}
    />
  );
}

export function Indicator({
  className,
  ...props
}: Stringly<BaseSlider.Indicator.Props>) {
  return (
    <BaseSlider.Indicator
      className={cn('bg-primary rounded-full select-none', className)}
      {...props}
    />
  );
}

/*
 * The thumb wraps a visually hidden `<input type="range">`, so keyboard focus
 * lands on the input; `has-focus-visible:` lifts the ring onto the thumb.
 */
export function Thumb({
  className,
  ...props
}: Stringly<BaseSlider.Thumb.Props>) {
  return (
    <BaseSlider.Thumb
      className={cn(
        focusRingWithin,
        'border-primary bg-background ease-default size-5 rounded-full border-2 shadow-sm transition-shadow duration-(--motion-hover-duration) select-none',
        className,
      )}
      {...props}
    />
  );
}
