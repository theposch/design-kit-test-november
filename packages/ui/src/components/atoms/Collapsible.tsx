import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { ChevronDown } from 'lucide-react';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root({
  className,
  ...props
}: Stringly<BaseCollapsible.Root.Props>) {
  return (
    <BaseCollapsible.Root
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
}

/* Appends a chevron that turns when the panel opens. */
export function Trigger({
  className,
  children,
  ...props
}: Stringly<BaseCollapsible.Trigger.Props>) {
  return (
    <BaseCollapsible.Trigger
      className={cn(
        focusRing,
        'group/trigger text-foreground flex w-full items-center justify-between gap-2 rounded-md py-1 text-start outline-none data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden
        className="text-muted-foreground ease-default size-4 shrink-0 transition-transform duration-(--motion-duration-normal) group-data-panel-open/trigger:rotate-180"
      />
    </BaseCollapsible.Trigger>
  );
}

/*
 * Animates height off `--collapsible-panel-height`. Padding sits on an inner
 * box so nothing peeks out once the panel has shrunk to nothing.
 */
export function Panel({
  className,
  children,
  ...props
}: Stringly<BaseCollapsible.Panel.Props>) {
  return (
    <BaseCollapsible.Panel
      className={cn(
        'ease-default h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-(--motion-duration-normal) data-ending-style:h-0 data-starting-style:h-0',
        className,
      )}
      {...props}
    >
      <div className="pt-2">{children}</div>
    </BaseCollapsible.Panel>
  );
}
