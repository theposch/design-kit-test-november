import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { ComponentProps } from 'react';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

type RootProps = Stringly<Omit<ComponentProps<'nav'>, 'aria-label'>> & {
  /** What screen readers call this navigation ("Main", "Settings"). */
  label: string;
};

/* A column of links to the places in an app, in named groups. */
export function Root({ label, className, ...props }: RootProps) {
  return (
    <nav
      aria-label={label}
      className={cn('flex flex-col gap-6', className)}
      {...props}
    />
  );
}

/* A set of related links, with an optional GroupLabel above them. */
export function Group({
  className,
  ...props
}: Stringly<ComponentProps<'div'>>) {
  return <div className={cn('flex flex-col gap-1', className)} {...props} />;
}

export function GroupLabel({
  render,
  className,
  ...props
}: useRender.ComponentProps<'h2'>) {
  return useRender({
    defaultTagName: 'h2',
    render,
    props: mergeProps<'h2'>(
      {
        className: cn(
          'type-label-xs text-muted-foreground px-3 pb-1',
          className,
        ),
      },
      props,
    ),
  });
}

export function List({ className, ...props }: Stringly<ComponentProps<'ul'>>) {
  return <ul className={cn('flex flex-col gap-0.5', className)} {...props} />;
}

export function Item(props: Stringly<ComponentProps<'li'>>) {
  return <li {...props} />;
}

type LinkProps = useRender.ComponentProps<'a'> & {
  /** This link is the page you're on: highlighted, and announced as current. */
  current?: boolean;
};

/*
 * One destination: an icon, a label, and anything at the end such as a count.
 * Pass your router's link with `render`.
 */
export function Link({
  render,
  className,
  current = false,
  ...props
}: LinkProps) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': current ? 'page' : undefined,
        className: cn(
          focusRing,
          'type-label-sm text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground aria-[current=page]:type-strong ease-default flex h-9 min-w-0 items-center gap-3 rounded-md px-3 transition-colors duration-(--motion-hover-duration) outline-none [&_svg]:size-4 [&_svg]:shrink-0',
          className,
        ),
      },
      props,
    ),
  });
}

/* Trailing content in a link, such as an unread count. */
export function LinkEnd({
  className,
  ...props
}: Stringly<ComponentProps<'span'>>) {
  return (
    <span
      className={cn('type-body-xs text-muted-foreground ms-auto', className)}
      {...props}
    />
  );
}
