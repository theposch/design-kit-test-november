import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root({
  className,
  ...props
}: Stringly<BaseAccordion.Root.Props>) {
  return (
    <BaseAccordion.Root
      className={cn('flex w-full flex-col', className)}
      {...props}
    />
  );
}

export function Item({
  className,
  ...props
}: Stringly<BaseAccordion.Item.Props>) {
  return (
    <BaseAccordion.Item
      className={cn('border-border border-b', className)}
      {...props}
    />
  );
}

export function Header({
  className,
  ...props
}: Stringly<BaseAccordion.Header.Props>) {
  return <BaseAccordion.Header className={cn('flex', className)} {...props} />;
}

/*
 * Appends the chevron itself, rotated off the trigger's `data-panel-open`, so
 * every row signals that it expands without each call site adding one.
 */
export function Trigger({
  className,
  children,
  ...props
}: Stringly<BaseAccordion.Trigger.Props>) {
  return (
    <BaseAccordion.Trigger
      className={cn(
        focusRing,
        'group/trigger type-label-base text-foreground flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left outline-none data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        aria-hidden
        className="text-muted-foreground ease-default size-4 shrink-0 transition-transform duration-(--motion-duration-normal) group-data-panel-open/trigger:rotate-180"
      />
    </BaseAccordion.Trigger>
  );
}

/*
 * Animates height off `--accordion-panel-height`. Padding sits on an inner
 * box: on the panel itself it would survive the collapse to `h-0` and leave
 * a sliver of the content showing.
 */
export function Panel({
  className,
  children,
  ...props
}: Stringly<BaseAccordion.Panel.Props>) {
  return (
    <BaseAccordion.Panel
      className={cn(
        'type-body-sm text-muted-foreground ease-default h-(--accordion-panel-height) overflow-hidden transition-[height] duration-(--motion-duration-normal) data-ending-style:h-0 data-starting-style:h-0',
        className,
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </BaseAccordion.Panel>
  );
}
