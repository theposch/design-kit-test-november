import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { cva, type VariantProps } from 'class-variance-authority';
import { Minus, Plus } from 'lucide-react';

import { focusRing, focusRingWithin } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root({
  className,
  ...props
}: Stringly<BaseNumberField.Root.Props>) {
  return (
    <BaseNumberField.Root
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    />
  );
}

/*
 * The field chrome, shared with Input and Select so a number field lines up
 * with them in a form row. The size ladder sits here because the group, not
 * the bare input, is what has a height.
 */
const groupVariants = cva(
  [
    focusRingWithin,
    'border-input bg-background text-foreground ease-default data-invalid:border-destructive flex w-full min-w-0 items-stretch overflow-hidden rounded-lg border transition-colors duration-(--motion-hover-duration) data-disabled:pointer-events-none data-disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'type-body-base tablet:type-body-xs h-8',
        md: 'type-body-base tablet:type-body-sm h-10',
        lg: 'type-body-base h-12',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export function Group({
  className,
  size,
  ...props
}: Stringly<BaseNumberField.Group.Props> & VariantProps<typeof groupVariants>) {
  return (
    <BaseNumberField.Group
      className={cn(groupVariants({ size }), className)}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: Stringly<BaseNumberField.Input.Props>) {
  return (
    <BaseNumberField.Input
      className={cn(
        'min-w-0 flex-1 bg-transparent px-3 text-center tabular-nums outline-none',
        className,
      )}
      {...props}
    />
  );
}

const stepClassName = cn(
  focusRing,
  'text-muted-foreground ease-default hover:bg-muted hover:text-foreground flex aspect-square shrink-0 items-center justify-center transition-colors duration-(--motion-hover-duration) outline-none data-disabled:opacity-50 [&_svg]:size-4',
);

type StepProps = Stringly<BaseNumberField.Decrement.Props> & {
  /** What the button does, for screen readers ("Fewer", "Remove one"). */
  label: string;
};

export function Decrement({ label, className, children, ...props }: StepProps) {
  return (
    <BaseNumberField.Decrement
      aria-label={label}
      className={cn(stepClassName, 'border-input border-e', className)}
      {...props}
    >
      {children ?? <Minus aria-hidden />}
    </BaseNumberField.Decrement>
  );
}

export function Increment({ label, className, children, ...props }: StepProps) {
  return (
    <BaseNumberField.Increment
      aria-label={label}
      className={cn(stepClassName, 'border-input border-s', className)}
      {...props}
    >
      {children ?? <Plus aria-hidden />}
    </BaseNumberField.Increment>
  );
}
