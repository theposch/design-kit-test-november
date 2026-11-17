import { Popover as BasePopover } from '@base-ui/react/popover';

import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root(props: BasePopover.Root.Props) {
  return <BasePopover.Root {...props} />;
}

export function Trigger({
  className,
  ...props
}: Stringly<BasePopover.Trigger.Props>) {
  return <BasePopover.Trigger className={cn(className)} {...props} />;
}

export function Portal(props: BasePopover.Portal.Props) {
  return <BasePopover.Portal {...props} />;
}

export function Backdrop({
  className,
  ...props
}: Stringly<BasePopover.Backdrop.Props>) {
  return <BasePopover.Backdrop className={cn(className)} {...props} />;
}

export function Positioner({
  className,
  sideOffset = 8,
  ...props
}: Stringly<BasePopover.Positioner.Props>) {
  return (
    <BasePopover.Positioner
      className={cn('outline-none', className)}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export function Popup({
  className,
  ...props
}: Stringly<BasePopover.Popup.Props>) {
  return (
    <BasePopover.Popup
      className={cn(
        'border-border bg-surface text-surface-foreground ease-default flex max-w-(--available-width) min-w-64 origin-(--transform-origin) flex-col gap-2 rounded-lg border p-4 shadow-lg transition-[opacity,scale] duration-(--motion-duration-fast) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export function Arrow({
  className,
  ...props
}: Stringly<BasePopover.Arrow.Props>) {
  return (
    <BasePopover.Arrow
      className={cn(
        'border-border bg-surface size-2.5 rotate-45 border data-[side=bottom]:-top-1.25 data-[side=bottom]:border-r-0 data-[side=bottom]:border-b-0 data-[side=left]:-right-1.25 data-[side=left]:border-b-0 data-[side=left]:border-l-0 data-[side=right]:-left-1.25 data-[side=right]:border-t-0 data-[side=right]:border-r-0 data-[side=top]:-bottom-1.25 data-[side=top]:border-t-0 data-[side=top]:border-l-0',
        className,
      )}
      {...props}
    />
  );
}

export function Title({
  className,
  ...props
}: Stringly<BasePopover.Title.Props>) {
  return (
    <BasePopover.Title
      className={cn('type-body-base text-surface-foreground', className)}
      {...props}
    />
  );
}

export function Description({
  className,
  ...props
}: Stringly<BasePopover.Description.Props>) {
  return (
    <BasePopover.Description
      className={cn('type-body-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function Close({
  className,
  ...props
}: Stringly<BasePopover.Close.Props>) {
  return <BasePopover.Close className={cn(className)} {...props} />;
}

export function Viewport({
  className,
  ...props
}: Stringly<BasePopover.Viewport.Props>) {
  return <BasePopover.Viewport className={cn(className)} {...props} />;
}
