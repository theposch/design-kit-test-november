import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { ChevronRight } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type RootProps = Omit<ComponentProps<'nav'>, 'className' | 'aria-label'> & {
  /** What screen readers call this trail ("Breadcrumb", "You are here"). */
  label: string;
  className?: string;
};

/* The trail of pages above this one. The last item is the current page. */
export function Root({ label, className, ...props }: RootProps) {
  return <nav aria-label={label} className={cn(className)} {...props} />;
}

export function List({
  className,
  ...props
}: Omit<ComponentProps<'ol'>, 'className'> & { className?: string }) {
  return (
    <ol
      className={cn(
        'type-body-sm text-muted-foreground flex min-w-0 flex-wrap items-center gap-1.5',
        className,
      )}
      {...props}
    />
  );
}

export function Item({
  className,
  ...props
}: Omit<ComponentProps<'li'>, 'className'> & { className?: string }) {
  return (
    <li
      className={cn('inline-flex min-w-0 items-center gap-1.5', className)}
      {...props}
    />
  );
}

/* A page above this one. Pass your router's link with `render`. */
export function Link({
  render,
  className,
  ...props
}: useRender.ComponentProps<'a'>) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        className: cn(
          focusRing,
          'hover:text-foreground ease-default truncate rounded-sm underline-offset-4 transition-colors duration-(--motion-hover-duration) outline-none hover:underline',
          className,
        ),
      },
      props,
    ),
  });
}

/* This page: not a link, and marked as the current page. */
export function Page({
  className,
  ...props
}: Omit<ComponentProps<'span'>, 'className'> & { className?: string }) {
  return (
    <span
      aria-current="page"
      className={cn('text-foreground truncate', className)}
      {...props}
    />
  );
}

/* The mark between items; hidden from screen readers, which read a list. */
export function Separator({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <li
      role="presentation"
      aria-hidden
      className={cn('flex [&_svg]:size-3.5', className)}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}
