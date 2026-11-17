import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '#lib/utils';

const rootVariants = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center gap-2 *:flex-1 *:last:flex-none',
      vertical: 'flex-col gap-4',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

/* The steps of a task done in order, like a checkout, and where you are in it. */
export function Root({
  render,
  className,
  orientation,
  ...props
}: useRender.ComponentProps<'ol'> & VariantProps<typeof rootVariants>) {
  return useRender({
    defaultTagName: 'ol',
    render,
    props: mergeProps<'ol'>(
      { className: cn(rootVariants({ orientation }), className) },
      props,
    ),
  });
}

type Status = 'complete' | 'current' | 'upcoming';

type ItemProps = Omit<ComponentProps<'li'>, 'className'> & {
  status: Status;
  className?: string;
};

/* The current step is marked for screen readers as well as by colour. */
export function Item({ status, className, ...props }: ItemProps) {
  return (
    <li
      data-status={status}
      aria-current={status === 'current' ? 'step' : undefined}
      className={cn('group/step flex min-w-0 items-center gap-2', className)}
      {...props}
    />
  );
}

/* The numbered circle; a completed step shows a tick instead of its number. */
export function Indicator({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'type-label-xs border-input text-muted-foreground group-data-[status=complete]/step:bg-primary group-data-[status=complete]/step:text-primary-foreground group-data-[status=current]/step:border-primary group-data-[status=current]/step:text-primary flex size-8 shrink-0 items-center justify-center rounded-full border group-data-[status=complete]/step:border-transparent',
        className,
      )}
    >
      <span className="group-data-[status=complete]/step:hidden">
        {children}
      </span>
      <Check
        aria-hidden
        className="hidden size-4 group-data-[status=complete]/step:block"
      />
    </span>
  );
}

export function Label({
  render,
  className,
  ...props
}: useRender.ComponentProps<'span'>) {
  return useRender({
    defaultTagName: 'span',
    render,
    props: mergeProps<'span'>(
      {
        className: cn(
          'type-body-sm text-muted-foreground group-data-[status=current]/step:text-foreground group-data-[status=current]/step:type-strong min-w-0 truncate',
          className,
        ),
      },
      props,
    ),
  });
}

/* The line to the next step. Use it in horizontal steppers only. */
export function Connector({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-border group-data-[status=complete]/step:bg-primary h-px min-w-4 flex-1',
        className,
      )}
    />
  );
}
