import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '#lib/utils';

const bannerVariants = cva(
  'flex w-full gap-3 rounded-lg border border-transparent p-4',
  {
    variants: {
      status: {
        info: 'bg-info-subtle text-info-subtle-foreground',
        success: 'bg-success-subtle text-success-subtle-foreground',
        warning: 'bg-warning-subtle text-warning-subtle-foreground',
        destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
      },
    },
    defaultVariants: { status: 'info' },
  },
);

const icons = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleAlert,
};

type RootProps = Omit<ComponentProps<'div'>, 'className'> &
  VariantProps<typeof bannerVariants> & { className?: string };

/*
 * A message about the page or a section of it. A destructive banner is an
 * alert, so screen readers announce it the moment it appears; the others
 * are polite status messages.
 */
export function Root({ status, className, children, ...props }: RootProps) {
  const Glyph = icons[status ?? 'info'];
  return (
    <div
      role={status === 'destructive' ? 'alert' : 'status'}
      className={cn(bannerVariants({ status }), className)}
      {...props}
    >
      <Glyph aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  );
}

type PartProps = useRender.ComponentProps<'p'>;

export function Title({ render, className, ...props }: PartProps) {
  return useRender({
    defaultTagName: 'p',
    render,
    props: mergeProps<'p'>(
      { className: cn('type-label-sm', className) },
      props,
    ),
  });
}

export function Description({ render, className, ...props }: PartProps) {
  return useRender({
    defaultTagName: 'p',
    render,
    props: mergeProps<'p'>({ className: cn('type-body-sm', className) }, props),
  });
}
