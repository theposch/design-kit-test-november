import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

const itemClassName =
  'type-body-sm text-surface-foreground data-highlighted:bg-muted relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';

const indicatorClassName =
  'absolute left-2 flex size-4 items-center justify-center';

export function Root(props: BaseMenu.Root.Props) {
  return <BaseMenu.Root {...props} />;
}

export function Trigger({
  className,
  ...props
}: Stringly<BaseMenu.Trigger.Props>) {
  return <BaseMenu.Trigger className={cn(className)} {...props} />;
}

export function Portal(props: BaseMenu.Portal.Props) {
  return <BaseMenu.Portal {...props} />;
}

export function Backdrop({
  className,
  ...props
}: Stringly<BaseMenu.Backdrop.Props>) {
  return <BaseMenu.Backdrop className={cn(className)} {...props} />;
}

export function Positioner({
  className,
  sideOffset = 6,
  align = 'start',
  ...props
}: Stringly<BaseMenu.Positioner.Props>) {
  return (
    <BaseMenu.Positioner
      className={cn('outline-none', className)}
      sideOffset={sideOffset}
      align={align}
      {...props}
    />
  );
}

export function Popup({ className, ...props }: Stringly<BaseMenu.Popup.Props>) {
  return (
    <BaseMenu.Popup
      className={cn(
        'border-border bg-surface text-surface-foreground ease-default max-h-(--available-height) min-w-48 origin-(--transform-origin) overflow-y-auto rounded-lg border p-1 shadow-lg transition-[opacity,scale] duration-(--motion-duration-fast) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export function Arrow({ className, ...props }: Stringly<BaseMenu.Arrow.Props>) {
  return (
    <BaseMenu.Arrow
      className={cn(
        'border-border bg-surface size-2 rotate-45 border data-[side=bottom]:-top-1 data-[side=bottom]:border-r-0 data-[side=bottom]:border-b-0 data-[side=left]:-right-1 data-[side=left]:border-b-0 data-[side=left]:border-l-0 data-[side=right]:-left-1 data-[side=right]:border-t-0 data-[side=right]:border-r-0 data-[side=top]:-bottom-1 data-[side=top]:border-t-0 data-[side=top]:border-l-0',
        className,
      )}
      {...props}
    />
  );
}

export function Viewport({
  className,
  ...props
}: Stringly<BaseMenu.Viewport.Props>) {
  return <BaseMenu.Viewport className={cn(className)} {...props} />;
}

export function Item({ className, ...props }: Stringly<BaseMenu.Item.Props>) {
  return <BaseMenu.Item className={cn(itemClassName, className)} {...props} />;
}

export function LinkItem({
  className,
  ...props
}: Stringly<BaseMenu.LinkItem.Props>) {
  return (
    <BaseMenu.LinkItem className={cn(itemClassName, className)} {...props} />
  );
}

export function Group({ className, ...props }: Stringly<BaseMenu.Group.Props>) {
  return <BaseMenu.Group className={cn(className)} {...props} />;
}

export function GroupLabel({
  className,
  ...props
}: Stringly<BaseMenu.GroupLabel.Props>) {
  return (
    <BaseMenu.GroupLabel
      className={cn(
        'type-label-xs text-muted-foreground px-2 py-1.5 select-none',
        className,
      )}
      {...props}
    />
  );
}

export function Separator({
  className,
  ...props
}: Stringly<BaseMenu.Separator.Props>) {
  return (
    <BaseMenu.Separator
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

export function SubmenuRoot(props: BaseMenu.SubmenuRoot.Props) {
  return <BaseMenu.SubmenuRoot {...props} />;
}

/*
 * Appends the chevron itself so every submenu row signals that it opens
 * another level, without each call site remembering to add one.
 */
export function SubmenuTrigger({
  className,
  children,
  ...props
}: Stringly<BaseMenu.SubmenuTrigger.Props>) {
  return (
    <BaseMenu.SubmenuTrigger
      className={cn(itemClassName, 'data-popup-open:bg-muted', className)}
      {...props}
    >
      {children}
      <ChevronRight aria-hidden className="text-muted-foreground ml-auto" />
    </BaseMenu.SubmenuTrigger>
  );
}

export function RadioGroup({
  className,
  ...props
}: Stringly<BaseMenu.RadioGroup.Props>) {
  return <BaseMenu.RadioGroup className={cn(className)} {...props} />;
}

export function RadioItem({
  className,
  ...props
}: Stringly<BaseMenu.RadioItem.Props>) {
  return (
    <BaseMenu.RadioItem
      className={cn(itemClassName, 'pl-8', className)}
      {...props}
    />
  );
}

export function RadioItemIndicator({
  className,
  children,
  ...props
}: Stringly<BaseMenu.RadioItemIndicator.Props>) {
  return (
    <BaseMenu.RadioItemIndicator
      className={cn(indicatorClassName, className)}
      {...props}
    >
      {children ?? <Circle aria-hidden className="size-2! fill-current" />}
    </BaseMenu.RadioItemIndicator>
  );
}

export function CheckboxItem({
  className,
  ...props
}: Stringly<BaseMenu.CheckboxItem.Props>) {
  return (
    <BaseMenu.CheckboxItem
      className={cn(itemClassName, 'pl-8', className)}
      {...props}
    />
  );
}

export function CheckboxItemIndicator({
  className,
  children,
  ...props
}: Stringly<BaseMenu.CheckboxItemIndicator.Props>) {
  return (
    <BaseMenu.CheckboxItemIndicator
      className={cn(indicatorClassName, className)}
      {...props}
    >
      {children ?? <Check aria-hidden />}
    </BaseMenu.CheckboxItemIndicator>
  );
}
