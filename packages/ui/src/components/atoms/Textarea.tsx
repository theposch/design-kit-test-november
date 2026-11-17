import { Input as BaseInput } from '@base-ui/react/input';
import type { ComponentProps } from 'react';

import { focusRingBordered } from '#lib/focusRing';
import { cn } from '#lib/utils';

type TextareaProps = Omit<ComponentProps<'textarea'>, 'className'> & {
  className?: string;
};

/*
 * Rendered through Base UI's Input so a textarea inside `Field.Root` gets the
 * same label, description and validation wiring as `Input`. No size ladder:
 * height comes from `rows`, not from a control-height rung.
 */
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <BaseInput
      render={
        <textarea
          className={cn(
            focusRingBordered,
            'border-input bg-background text-foreground type-body-base tablet:type-body-sm placeholder:text-muted-foreground ease-default data-invalid:border-destructive data-invalid:ring-destructive aria-invalid:border-destructive aria-invalid:ring-destructive field-sizing-content min-h-20 w-full min-w-0 resize-y rounded-lg border px-3 py-2 transition-colors duration-(--motion-hover-duration) outline-none disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50',
            className,
          )}
          {...props}
        />
      }
    />
  );
}
