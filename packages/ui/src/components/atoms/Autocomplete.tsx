import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';

import { focusRingWithin } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * A text input that suggests matches as you type, without fixing the value
 * to one of them. With `inline open` the list sits under the input instead
 * of in a popup, as in a command palette. Name the input with a Field.Label.
 */
export function Root<Value>(props: BaseAutocomplete.Root.Props<Value>) {
  /* Base UI types `items` as flat or grouped through two overloads; pass both through. */
  const passThrough = props as BaseAutocomplete.Root.Props<Value> & {
    items?: readonly Value[];
  };
  return <BaseAutocomplete.Root {...passThrough} />;
}

export function InputGroup({
  className,
  ...props
}: Stringly<BaseAutocomplete.InputGroup.Props>) {
  return (
    <BaseAutocomplete.InputGroup
      className={cn(
        focusRingWithin,
        'border-input bg-background text-foreground type-body-base tablet:type-body-sm flex h-10 w-full min-w-0 items-center gap-2 rounded-lg border px-3 [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: Stringly<BaseAutocomplete.Input.Props>) {
  return (
    <BaseAutocomplete.Input
      className={cn(
        'placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent outline-none',
        className,
      )}
      {...props}
    />
  );
}

export function Portal(props: BaseAutocomplete.Portal.Props) {
  return <BaseAutocomplete.Portal {...props} />;
}

export function Positioner({
  className,
  sideOffset = 4,
  ...props
}: Stringly<BaseAutocomplete.Positioner.Props>) {
  return (
    <BaseAutocomplete.Positioner
      className={cn('outline-none', className)}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

export function Popup({
  className,
  ...props
}: Stringly<BaseAutocomplete.Popup.Props>) {
  return (
    <BaseAutocomplete.Popup
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
}: Stringly<BaseAutocomplete.Empty.Props>) {
  return (
    <BaseAutocomplete.Empty
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
}: Stringly<BaseAutocomplete.List.Props>) {
  return (
    <BaseAutocomplete.List
      className={cn('outline-none', className)}
      {...props}
    />
  );
}

export function Item({
  className,
  ...props
}: Stringly<BaseAutocomplete.Item.Props>) {
  return (
    <BaseAutocomplete.Item
      className={cn(
        'type-body-sm text-surface-foreground data-highlighted:bg-muted flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

export function Group({
  className,
  ...props
}: Stringly<BaseAutocomplete.Group.Props>) {
  return <BaseAutocomplete.Group className={cn(className)} {...props} />;
}

export function GroupLabel({
  className,
  ...props
}: Stringly<BaseAutocomplete.GroupLabel.Props>) {
  return (
    <BaseAutocomplete.GroupLabel
      className={cn(
        'type-label-xs text-muted-foreground px-2 py-1.5',
        className,
      )}
      {...props}
    />
  );
}

export function Collection(props: BaseAutocomplete.Collection.Props) {
  return <BaseAutocomplete.Collection {...props} />;
}
