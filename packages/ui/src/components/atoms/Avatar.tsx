import { Avatar as BaseAvatar } from '@base-ui/react/avatar';

import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * No size prop (docs/adr/0005): an avatar is not a control. It defaults to
 * `size-10` and a consumer sets another footprint with a `size-*` class.
 */
export function Root({ className, ...props }: Stringly<BaseAvatar.Root.Props>) {
  return (
    <BaseAvatar.Root
      className={cn(
        'bg-secondary inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full align-middle select-none',
        className,
      )}
      {...props}
    />
  );
}

export function Image({
  className,
  ...props
}: Stringly<BaseAvatar.Image.Props>) {
  return (
    <BaseAvatar.Image
      className={cn('size-full object-cover', className)}
      {...props}
    />
  );
}

export function Fallback({
  className,
  ...props
}: Stringly<BaseAvatar.Fallback.Props>) {
  return (
    <BaseAvatar.Fallback
      className={cn(
        'type-body-sm text-secondary-foreground flex size-full items-center justify-center',
        className,
      )}
      {...props}
    />
  );
}
