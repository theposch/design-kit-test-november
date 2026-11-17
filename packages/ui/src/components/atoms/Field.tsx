import { Field as BaseField } from '@base-ui/react/field';

import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root({ className, ...props }: Stringly<BaseField.Root.Props>) {
  return (
    <BaseField.Root
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: Stringly<BaseField.Label.Props>) {
  return (
    <BaseField.Label
      className={cn(
        'type-label-sm text-foreground flex items-center gap-2 select-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

/*
 * Unstyled on purpose: inside a Field, render the library's `Input` (Base
 * UI's Input is Field-aware), which carries the control styling and size
 * ladder. This part exists so the anatomy is complete and for the rare
 * custom control that renders through `render`.
 */
export function Control({
  className,
  ...props
}: Stringly<BaseField.Control.Props>) {
  return <BaseField.Control className={cn(className)} {...props} />;
}

export function Description({
  className,
  ...props
}: Stringly<BaseField.Description.Props>) {
  return (
    <BaseField.Description
      className={cn('type-body-xs text-muted-foreground', className)}
      {...props}
    />
  );
}

export function Error({
  className,
  ...props
}: Stringly<BaseField.Error.Props>) {
  return (
    <BaseField.Error
      className={cn(
        'type-body-xs text-destructive ease-default transition-opacity duration-(--motion-duration-fast) data-ending-style:opacity-0 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

export function Validity(props: BaseField.Validity.Props) {
  return <BaseField.Validity {...props} />;
}

export function Item({ className, ...props }: Stringly<BaseField.Item.Props>) {
  return (
    <BaseField.Item
      className={cn('flex items-center gap-2', className)}
      {...props}
    />
  );
}
