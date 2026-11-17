import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Check, Minus } from 'lucide-react';

import { focusRingBordered } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root({
  className,
  ...props
}: Stringly<BaseCheckbox.Root.Props>) {
  return (
    <BaseCheckbox.Root
      className={cn(
        focusRingBordered,
        'group/checkbox border-input bg-background text-primary-foreground ease-default data-checked:border-primary data-checked:bg-primary data-indeterminate:border-primary data-indeterminate:bg-primary data-invalid:border-destructive inline-flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors duration-(--motion-hover-duration) outline-none data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

/*
 * Renders the tick by default, swapping to a dash for the mixed state off the
 * root's `data-indeterminate`, so the common case needs no children. Pass
 * children to replace the glyphs entirely.
 */
export function Indicator({
  className,
  children,
  ...props
}: Stringly<BaseCheckbox.Indicator.Props>) {
  return (
    <BaseCheckbox.Indicator
      className={cn(
        'flex items-center justify-center [&_svg]:size-3.5 [&_svg]:stroke-3',
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <Check
            aria-hidden
            className="group-data-indeterminate/checkbox:hidden"
          />
          <Minus
            aria-hidden
            className="hidden group-data-indeterminate/checkbox:block"
          />
        </>
      )}
    </BaseCheckbox.Indicator>
  );
}
