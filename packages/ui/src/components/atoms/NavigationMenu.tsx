import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import { ChevronDown } from 'lucide-react';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * Site navigation across the top, where an item can open a wide panel of
 * links. Put the panel's links in Content; Viewport shows the open one.
 */
export function Root({
  className,
  ...props
}: Stringly<BaseNavigationMenu.Root.Props>) {
  return (
    <BaseNavigationMenu.Root className={cn('min-w-0', className)} {...props} />
  );
}

export function List({
  className,
  ...props
}: Stringly<BaseNavigationMenu.List.Props>) {
  return (
    <BaseNavigationMenu.List
      className={cn('relative flex items-center gap-1', className)}
      {...props}
    />
  );
}

export function Item({
  className,
  ...props
}: Stringly<BaseNavigationMenu.Item.Props>) {
  return <BaseNavigationMenu.Item className={cn(className)} {...props} />;
}

const triggerClassName = cn(
  focusRing,
  'type-label-sm text-foreground hover:bg-muted data-popup-open:bg-muted ease-default inline-flex h-9 items-center gap-1 rounded-md px-3 whitespace-nowrap transition-colors duration-(--motion-hover-duration) outline-none select-none',
);

/* Opens the item's panel. The chevron turns while it's open. */
export function Trigger({
  className,
  children,
  ...props
}: Stringly<BaseNavigationMenu.Trigger.Props>) {
  return (
    <BaseNavigationMenu.Trigger
      className={cn(triggerClassName, className)}
      {...props}
    >
      {children}
      <BaseNavigationMenu.Icon className="ease-default transition-transform duration-(--motion-duration-fast) data-popup-open:rotate-180">
        <ChevronDown aria-hidden className="size-4" />
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  );
}

export function Content({
  className,
  ...props
}: Stringly<BaseNavigationMenu.Content.Props>) {
  return (
    <BaseNavigationMenu.Content
      className={cn(
        'ease-default tablet:w-max tablet:max-w-2xl h-full w-[calc(100vw-2rem)] p-2 transition-opacity duration-(--motion-duration-fast) data-ending-style:opacity-0 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

type LinkProps = Stringly<BaseNavigationMenu.Link.Props> & {
  /**
   * `bar` sits in the List beside the triggers; `panel` is a roomy block
   * inside Content, with a title and a line of description.
   */
  variant?: 'bar' | 'panel';
};

/* A destination. Pass your router's link with `render`. */
export function Link({ className, variant = 'panel', ...props }: LinkProps) {
  return (
    <BaseNavigationMenu.Link
      className={cn(
        variant === 'bar'
          ? triggerClassName
          : cn(
              focusRing,
              'hover:bg-muted ease-default flex flex-col gap-1 rounded-md p-3 transition-colors duration-(--motion-hover-duration) outline-none',
            ),
        className,
      )}
      {...props}
    />
  );
}

export function Portal(props: BaseNavigationMenu.Portal.Props) {
  return <BaseNavigationMenu.Portal {...props} />;
}

export function Positioner({
  className,
  sideOffset = 8,
  collisionPadding = 16,
  ...props
}: Stringly<BaseNavigationMenu.Positioner.Props>) {
  return (
    <BaseNavigationMenu.Positioner
      className={cn(
        'ease-default h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-(--motion-duration-normal) data-instant:transition-none',
        className,
      )}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      collisionAvoidance={{ side: 'none' }}
      {...props}
    />
  );
}

export function Popup({
  className,
  ...props
}: Stringly<BaseNavigationMenu.Popup.Props>) {
  return (
    <BaseNavigationMenu.Popup
      className={cn(
        'border-border bg-surface text-surface-foreground ease-default relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) rounded-xl border shadow-lg transition-[opacity,scale,width,height] duration-(--motion-duration-normal) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export function Viewport({
  className,
  ...props
}: Stringly<BaseNavigationMenu.Viewport.Props>) {
  return (
    <BaseNavigationMenu.Viewport
      className={cn('relative size-full overflow-hidden', className)}
      {...props}
    />
  );
}
