import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { Check, ChevronsUpDown, X } from 'lucide-react';

import { focusRing, focusRingWithin } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * Type to filter a list, then pick one value, or several with `multiple`
 * (chosen values show as chips inside the field). The field chrome matches
 * Input and Select. Name it with Field.Root and Field.Label.
 */
export function Root<Value, Multiple extends boolean | undefined = false>(
  props: BaseCombobox.Root.Props<Value, Multiple>,
) {
  return <BaseCombobox.Root {...props} />;
}

export function InputGroup({
  className,
  ...props
}: Stringly<BaseCombobox.InputGroup.Props>) {
  return (
    <BaseCombobox.InputGroup
      className={cn(
        focusRingWithin,
        'border-input bg-background text-foreground type-body-base tablet:type-body-sm ease-default data-invalid:border-destructive flex min-h-10 w-full min-w-0 items-center gap-1 rounded-lg border px-1 transition-colors duration-(--motion-hover-duration) data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: Stringly<BaseCombobox.Input.Props>) {
  return (
    <BaseCombobox.Input
      className={cn(
        'placeholder:text-muted-foreground h-8 min-w-12 flex-1 bg-transparent px-2 outline-none',
        className,
      )}
      {...props}
    />
  );
}

const iconButtonClassName = cn(
  focusRing,
  'text-muted-foreground hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-md outline-none [&_svg]:size-4',
);

type LabelledProps<P> = Stringly<P> & {
  /** What the button does, for screen readers ("Show options", "Clear"). */
  label: string;
};

export function Trigger({
  label,
  className,
  children,
  ...props
}: LabelledProps<BaseCombobox.Trigger.Props>) {
  return (
    <BaseCombobox.Trigger
      aria-label={label}
      className={cn(iconButtonClassName, className)}
      {...props}
    >
      {children ?? <ChevronsUpDown aria-hidden />}
    </BaseCombobox.Trigger>
  );
}

export function Clear({
  label,
  className,
  children,
  ...props
}: LabelledProps<BaseCombobox.Clear.Props>) {
  return (
    <BaseCombobox.Clear
      aria-label={label}
      className={cn(iconButtonClassName, className)}
      {...props}
    >
      {children ?? <X aria-hidden />}
    </BaseCombobox.Clear>
  );
}

export function Value(props: BaseCombobox.Value.Props) {
  return <BaseCombobox.Value {...props} />;
}

export function Chips({
  className,
  ...props
}: Stringly<BaseCombobox.Chips.Props>) {
  return (
    <BaseCombobox.Chips
      className={cn(
        'flex min-w-0 flex-1 flex-wrap items-center gap-1 py-1',
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  className,
  ...props
}: Stringly<BaseCombobox.Chip.Props>) {
  return (
    <BaseCombobox.Chip
      className={cn(
        'bg-secondary text-secondary-foreground type-body-xs data-highlighted:ring-ring flex h-6 items-center gap-1 rounded-md ps-2 outline-none data-highlighted:ring-2',
        className,
      )}
      {...props}
    />
  );
}

export function ChipRemove({
  label,
  className,
  children,
  ...props
}: LabelledProps<BaseCombobox.ChipRemove.Props>) {
  return (
    <BaseCombobox.ChipRemove
      aria-label={label}
      className={cn(
        'hover:bg-muted flex size-6 items-center justify-center rounded-md [&_svg]:size-3',
        className,
      )}
      {...props}
    >
      {children ?? <X aria-hidden />}
    </BaseCombobox.ChipRemove>
  );
}

export function Portal(props: BaseCombobox.Portal.Props) {
  return <BaseCombobox.Portal {...props} />;
}

export function Positioner({
  className,
  sideOffset = 4,
  ...props
}: Stringly<BaseCombobox.Positioner.Props>) {
  return (
    <BaseCombobox.Positioner
      sideOffset={sideOffset}
      className={cn('z-50 outline-none', className)}
      {...props}
    />
  );
}

export function Popup({
  className,
  ...props
}: Stringly<BaseCombobox.Popup.Props>) {
  return (
    <BaseCombobox.Popup
      className={cn(
        'border-border bg-surface text-surface-foreground ease-default max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-lg border p-1 shadow-lg transition-[opacity,scale] duration-(--motion-duration-fast) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export function Empty({
  className,
  ...props
}: Stringly<BaseCombobox.Empty.Props>) {
  return (
    <BaseCombobox.Empty
      className={cn(
        'type-body-sm text-muted-foreground px-2 py-1.5 empty:hidden',
        className,
      )}
      {...props}
    />
  );
}

export function List({
  className,
  ...props
}: Stringly<BaseCombobox.List.Props>) {
  return (
    <BaseCombobox.List
      className={cn('outline-none data-empty:hidden', className)}
      {...props}
    />
  );
}

export function Item({
  className,
  ...props
}: Stringly<BaseCombobox.Item.Props>) {
  return (
    <BaseCombobox.Item
      className={cn(
        'type-body-sm text-surface-foreground data-highlighted:bg-muted relative flex cursor-default items-center gap-2 rounded-md py-1.5 ps-8 pe-2 outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50',
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
}: Stringly<BaseCombobox.ItemIndicator.Props>) {
  return (
    <BaseCombobox.ItemIndicator
      className={cn(
        'absolute start-2 flex size-4 items-center justify-center [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {children ?? <Check aria-hidden />}
    </BaseCombobox.ItemIndicator>
  );
}

export function Group({
  className,
  ...props
}: Stringly<BaseCombobox.Group.Props>) {
  return <BaseCombobox.Group className={cn(className)} {...props} />;
}

export function GroupLabel({
  className,
  ...props
}: Stringly<BaseCombobox.GroupLabel.Props>) {
  return (
    <BaseCombobox.GroupLabel
      className={cn(
        'type-label-xs text-muted-foreground px-2 py-1.5',
        className,
      )}
      {...props}
    />
  );
}
