import { Tabs as BaseTabs } from '@base-ui/react/tabs';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root({ className, ...props }: Stringly<BaseTabs.Root.Props>) {
  return (
    <BaseTabs.Root
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
}

export function List({ className, ...props }: Stringly<BaseTabs.List.Props>) {
  return (
    <BaseTabs.List
      className={cn(
        'border-border relative z-0 flex gap-1 border-b',
        className,
      )}
      {...props}
    />
  );
}

export function Tab({ className, ...props }: Stringly<BaseTabs.Tab.Props>) {
  return (
    <BaseTabs.Tab
      className={cn(
        focusRing,
        'type-label-sm text-muted-foreground ease-default hover:text-foreground data-active:text-foreground inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 whitespace-nowrap transition-colors duration-(--motion-hover-duration) outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

/*
 * Sits on the list's bottom border and slides between tabs off the
 * `--active-tab-*` variables Base UI writes, so the active tab needs no
 * styling of its own beyond its text colour.
 */
export function Indicator({
  className,
  ...props
}: Stringly<BaseTabs.Indicator.Props>) {
  return (
    <BaseTabs.Indicator
      className={cn(
        'bg-primary ease-default absolute bottom-0 left-0 -z-1 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-px transition-[translate,width] duration-(--motion-duration-normal)',
        className,
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: Stringly<BaseTabs.Panel.Props>) {
  return (
    <BaseTabs.Panel
      className={cn(focusRing, 'rounded-md outline-none', className)}
      {...props}
    />
  );
}
