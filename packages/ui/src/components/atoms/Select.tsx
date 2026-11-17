import { Select as BaseSelect } from '@base-ui/react/select';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';

import { focusRingBordered } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * The trigger is a control, so it carries the same sm/md/lg ladder and the
 * same field chrome as Input: a select and a text input placed in one form
 * row line up at every rung.
 */
const triggerVariants = cva(
  [
    focusRingBordered,
    'border-input bg-background text-foreground ease-default data-invalid:border-destructive data-popup-open:border-ring flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border whitespace-nowrap transition-colors duration-(--motion-hover-duration) outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'type-body-base tablet:type-body-xs h-8 px-2.5',
        md: 'type-body-base tablet:type-body-sm h-10 px-3',
        lg: 'type-body-base h-12 px-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const scrollArrowClassName =
  'bg-surface text-muted-foreground z-1 flex h-6 w-full cursor-default items-center justify-center [&_svg]:size-4';

export function Root<Value, Multiple extends boolean | undefined = false>(
  props: BaseSelect.Root.Props<Value, Multiple>,
) {
  return <BaseSelect.Root {...props} />;
}

export function Label({
  className,
  ...props
}: Stringly<BaseSelect.Label.Props>) {
  return (
    <BaseSelect.Label
      className={cn(
        'type-label-sm text-foreground cursor-default select-none',
        className,
      )}
      {...props}
    />
  );
}

export function Trigger({
  className,
  size,
  ...props
}: Stringly<BaseSelect.Trigger.Props> & VariantProps<typeof triggerVariants>) {
  return (
    <BaseSelect.Trigger
      className={cn(triggerVariants({ size, className }))}
      {...props}
    />
  );
}

export function Value({
  className,
  ...props
}: Stringly<BaseSelect.Value.Props>) {
  return (
    <BaseSelect.Value
      className={cn(
        'data-placeholder:text-muted-foreground truncate',
        className,
      )}
      {...props}
    />
  );
}

export function Icon({
  className,
  children,
  ...props
}: Stringly<BaseSelect.Icon.Props>) {
  return (
    <BaseSelect.Icon
      className={cn(
        'text-muted-foreground flex shrink-0 [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {children ?? <ChevronsUpDown aria-hidden />}
    </BaseSelect.Icon>
  );
}

export function Portal(props: BaseSelect.Portal.Props) {
  return <BaseSelect.Portal {...props} />;
}

export function Backdrop({
  className,
  ...props
}: Stringly<BaseSelect.Backdrop.Props>) {
  return <BaseSelect.Backdrop className={cn(className)} {...props} />;
}

/*
 * Defaults to opening below the trigger like Menu does. Base UI's default,
 * `alignItemWithTrigger`, overlays the popup on the trigger macOS-style;
 * pass `alignItemWithTrigger` to opt back in.
 */
export function Positioner({
  className,
  sideOffset = 6,
  alignItemWithTrigger = false,
  ...props
}: Stringly<BaseSelect.Positioner.Props>) {
  return (
    <BaseSelect.Positioner
      className={cn('outline-none select-none', className)}
      sideOffset={sideOffset}
      alignItemWithTrigger={alignItemWithTrigger}
      {...props}
    />
  );
}

export function Popup({
  className,
  ...props
}: Stringly<BaseSelect.Popup.Props>) {
  return (
    <BaseSelect.Popup
      className={cn(
        'border-border bg-surface text-surface-foreground ease-default relative min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-lg border shadow-lg transition-[opacity,scale] duration-(--motion-duration-fast) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export function List({ className, ...props }: Stringly<BaseSelect.List.Props>) {
  return (
    <BaseSelect.List
      className={cn(
        'relative max-h-(--available-height) scroll-py-6 overflow-y-auto p-1',
        className,
      )}
      {...props}
    />
  );
}

export function Item({ className, ...props }: Stringly<BaseSelect.Item.Props>) {
  return (
    <BaseSelect.Item
      className={cn(
        'type-body-sm text-surface-foreground data-highlighted:bg-muted relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-2 pl-8 outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

export function ItemIndicator({
  className,
  children,
  ...props
}: Stringly<BaseSelect.ItemIndicator.Props>) {
  return (
    <BaseSelect.ItemIndicator
      className={cn(
        'absolute left-2 flex size-4 items-center justify-center',
        className,
      )}
      {...props}
    >
      {children ?? <Check aria-hidden />}
    </BaseSelect.ItemIndicator>
  );
}

export function ItemText({
  className,
  ...props
}: Stringly<BaseSelect.ItemText.Props>) {
  return <BaseSelect.ItemText className={cn(className)} {...props} />;
}

export function Arrow({
  className,
  ...props
}: Stringly<BaseSelect.Arrow.Props>) {
  return (
    <BaseSelect.Arrow
      className={cn(
        'border-border bg-surface size-2 rotate-45 border data-[side=bottom]:-top-1 data-[side=bottom]:border-r-0 data-[side=bottom]:border-b-0 data-[side=top]:-bottom-1 data-[side=top]:border-t-0 data-[side=top]:border-l-0',
        className,
      )}
      {...props}
    />
  );
}

export function ScrollUpArrow({
  className,
  children,
  ...props
}: Stringly<BaseSelect.ScrollUpArrow.Props>) {
  return (
    <BaseSelect.ScrollUpArrow
      className={cn(scrollArrowClassName, 'top-0', className)}
      {...props}
    >
      {children ?? <ChevronUp aria-hidden />}
    </BaseSelect.ScrollUpArrow>
  );
}

export function ScrollDownArrow({
  className,
  children,
  ...props
}: Stringly<BaseSelect.ScrollDownArrow.Props>) {
  return (
    <BaseSelect.ScrollDownArrow
      className={cn(scrollArrowClassName, 'bottom-0', className)}
      {...props}
    >
      {children ?? <ChevronDown aria-hidden />}
    </BaseSelect.ScrollDownArrow>
  );
}

export function Group({
  className,
  ...props
}: Stringly<BaseSelect.Group.Props>) {
  return <BaseSelect.Group className={cn(className)} {...props} />;
}

export function GroupLabel({
  className,
  ...props
}: Stringly<BaseSelect.GroupLabel.Props>) {
  return (
    <BaseSelect.GroupLabel
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
}: Stringly<BaseSelect.Separator.Props>) {
  return (
    <BaseSelect.Separator
      className={cn('bg-border -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}
