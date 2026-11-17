import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

import { cn } from '#lib/utils';

const layoutVariants = cva('bg-background text-foreground flex flex-col', {
  variants: {
    /* `screen` fixes the page to the window and scrolls each area itself. */
    height: {
      auto: 'min-h-dvh',
      screen: 'h-dvh overflow-hidden',
    },
  },
  defaultVariants: { height: 'auto' },
});

/* How wide the content may get before it stops growing and centres. */
const contentVariants = cva(
  'mx-auto w-full px-4 py-6 tablet:px-6 tablet:py-8 desktop:px-8',
  {
    variants: {
      width: {
        narrow: 'max-w-2xl',
        default: 'max-w-6xl',
        wide: 'max-w-7xl',
        full: '',
      },
    },
    defaultVariants: { width: 'default' },
  },
);

/* A side panel and the name screen readers announce for it ("Filters"). */
type Panel = { label: string; content: ReactNode };

type LayoutProps = VariantProps<typeof layoutVariants> &
  VariantProps<typeof contentVariants> & {
    /** Page content. */
    children?: ReactNode;
    /** A bar across the top: title, actions, navigation. */
    header?: ReactNode;
    /** A side panel before the content (left in left-to-right languages). */
    start?: Panel;
    /** A side panel after the content. */
    end?: Panel;
    /** A bar across the bottom. */
    footer?: ReactNode;
    className?: string;
  };

/*
 * The page frame. Side panels sit beside the content from desktop width up
 * and stack above and below it on tablets and phones.
 */
export function Layout({
  children,
  header,
  start,
  end,
  footer,
  height,
  width,
  className,
}: LayoutProps) {
  const scrolls = height === 'screen';
  return (
    <div className={cn(layoutVariants({ height }), className)}>
      {header && (
        <header className="border-border tablet:px-6 shrink-0 border-b px-4 py-4">
          {header}
        </header>
      )}
      <div className="desktop:flex-row flex min-h-0 flex-1 flex-col">
        {start && (
          <aside
            aria-label={start.label}
            className={cn(
              'border-border max-desktop:border-b tablet:p-6 desktop:w-64 desktop:border-e shrink-0 p-4',
              scrolls && 'desktop:overflow-y-auto',
            )}
          >
            {start.content}
          </aside>
        )}
        <main className={cn('min-w-0 flex-1', scrolls && 'overflow-y-auto')}>
          <div className={contentVariants({ width })}>{children}</div>
        </main>
        {end && (
          <aside
            aria-label={end.label}
            className={cn(
              'border-border max-desktop:border-t tablet:p-6 desktop:w-80 desktop:border-s shrink-0 p-4',
              scrolls && 'desktop:overflow-y-auto',
            )}
          >
            {end.content}
          </aside>
        )}
      </div>
      {footer && (
        <footer className="border-border tablet:px-6 shrink-0 border-t px-4 py-4">
          {footer}
        </footer>
      )}
    </div>
  );
}
