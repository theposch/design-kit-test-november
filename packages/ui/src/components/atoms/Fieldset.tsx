import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';

import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/* A titled group of related fields, like "Shipping address". */
export function Root({
  className,
  ...props
}: Stringly<BaseFieldset.Root.Props>) {
  return (
    <BaseFieldset.Root
      className={cn('flex min-w-0 flex-col gap-4 border-0 p-0', className)}
      {...props}
    />
  );
}

export function Legend({
  className,
  ...props
}: Stringly<BaseFieldset.Legend.Props>) {
  return (
    <BaseFieldset.Legend
      className={cn('type-heading-4 text-foreground', className)}
      {...props}
    />
  );
}
