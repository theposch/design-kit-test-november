import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Menubar as BaseMenubar } from '@base-ui/react/menubar';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * A row of menus such as File, Edit and View, for app-like tools. Put a Menu
 * in it for each heading and use Menubar.Trigger as that menu's trigger;
 * arrow keys move between them.
 */
export function Root({ className, ...props }: Stringly<BaseMenubar.Props>) {
  return (
    <BaseMenubar
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  );
}

export function Trigger({
  className,
  ...props
}: Stringly<BaseMenu.Trigger.Props>) {
  return (
    <BaseMenu.Trigger
      className={cn(
        focusRing,
        'type-label-sm text-foreground hover:bg-muted data-popup-open:bg-muted ease-default inline-flex h-8 items-center rounded-md px-2.5 transition-colors duration-(--motion-hover-duration) outline-none select-none',
        className,
      )}
      {...props}
    />
  );
}
