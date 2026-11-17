import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Provider(props: BaseTooltip.Provider.Props) {
  return <BaseTooltip.Provider {...props} />;
}

export function Root(props: BaseTooltip.Root.Props) {
  return <BaseTooltip.Root {...props} />;
}

export function Trigger({
  className,
  ...props
}: Stringly<BaseTooltip.Trigger.Props>) {
  return <BaseTooltip.Trigger className={cn(className)} {...props} />;
}

export function Portal(props: BaseTooltip.Portal.Props) {
  return <BaseTooltip.Portal {...props} />;
}

export function Positioner({
  className,
  sideOffset = 8,
  ...props
}: Stringly<BaseTooltip.Positioner.Props>) {
  return (
    <BaseTooltip.Positioner
      className={cn(className)}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

/*
 * Inverted against the page (foreground fill, background text) so it reads as
 * a transient overlay in either mode without a dedicated token pair.
 */
export function Popup({
  className,
  ...props
}: Stringly<BaseTooltip.Popup.Props>) {
  return (
    <BaseTooltip.Popup
      className={cn(
        'type-body-xs bg-foreground text-background ease-default relative max-w-xs origin-(--transform-origin) rounded-md px-2.5 py-1.5 shadow-md transition-[opacity,scale] duration-(--motion-duration-fast) data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export function Arrow({
  className,
  ...props
}: Stringly<BaseTooltip.Arrow.Props>) {
  return (
    <BaseTooltip.Arrow
      className={cn(
        'bg-foreground size-2 rotate-45 data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1',
        className,
      )}
      {...props}
    />
  );
}

export function Viewport({
  className,
  ...props
}: Stringly<BaseTooltip.Viewport.Props>) {
  return <BaseTooltip.Viewport className={cn(className)} {...props} />;
}
