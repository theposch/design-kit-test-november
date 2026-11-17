import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { cva, type VariantProps } from 'class-variance-authority';

import { dialogClasses } from '#lib/dialogClasses';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * A panel that slides in from the side, such as navigation on a phone.
 * Match Root's `swipeDirection` to the Popup's `side`: start is "left" and
 * end is "right" in left-to-right languages.
 */
export function Root(props: BaseDrawer.Root.Props) {
  return <BaseDrawer.Root {...props} />;
}

export function Trigger({
  className,
  ...props
}: Stringly<BaseDrawer.Trigger.Props>) {
  return <BaseDrawer.Trigger className={cn(className)} {...props} />;
}

export function Portal(props: BaseDrawer.Portal.Props) {
  return <BaseDrawer.Portal {...props} />;
}

export function Backdrop({
  className,
  ...props
}: Stringly<BaseDrawer.Backdrop.Props>) {
  return (
    <BaseDrawer.Backdrop
      className={cn(dialogClasses.backdrop, className)}
      {...props}
    />
  );
}

const viewportVariants = cva('fixed inset-0 flex items-stretch', {
  variants: {
    side: { start: 'justify-start', end: 'justify-end' },
  },
  defaultVariants: { side: 'start' },
});

export function Viewport({
  className,
  side,
  ...props
}: Stringly<BaseDrawer.Viewport.Props> &
  VariantProps<typeof viewportVariants>) {
  return (
    <BaseDrawer.Viewport
      className={cn(viewportVariants({ side }), className)}
      {...props}
    />
  );
}

const popupVariants = cva(
  'border-border bg-surface text-surface-foreground ease-default flex h-full w-80 max-w-[calc(100vw-3rem)] flex-col gap-4 overflow-y-auto overscroll-contain p-4 shadow-lg transition-[translate,transform] duration-(--motion-duration-normal) outline-none [transform:translateX(var(--drawer-swipe-movement-x))] data-swiping:transition-none data-swiping:select-none',
  {
    variants: {
      side: {
        start:
          'border-e data-ending-style:-translate-x-full data-starting-style:-translate-x-full',
        end: 'border-s data-ending-style:translate-x-full data-starting-style:translate-x-full',
      },
    },
    defaultVariants: { side: 'start' },
  },
);

export function Popup({
  className,
  side,
  ...props
}: Stringly<BaseDrawer.Popup.Props> & VariantProps<typeof popupVariants>) {
  return (
    <BaseDrawer.Popup
      className={cn(popupVariants({ side }), className)}
      {...props}
    />
  );
}

/* Holds the text, so people can select it without starting a swipe. */
export function Content({
  className,
  ...props
}: Stringly<BaseDrawer.Content.Props>) {
  return (
    <BaseDrawer.Content
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
}

export function Title({
  className,
  ...props
}: Stringly<BaseDrawer.Title.Props>) {
  return (
    <BaseDrawer.Title
      className={cn(dialogClasses.title, className)}
      {...props}
    />
  );
}

export function Description({
  className,
  ...props
}: Stringly<BaseDrawer.Description.Props>) {
  return (
    <BaseDrawer.Description
      className={cn(dialogClasses.description, className)}
      {...props}
    />
  );
}

export function Close({
  className,
  ...props
}: Stringly<BaseDrawer.Close.Props>) {
  return <BaseDrawer.Close className={cn(className)} {...props} />;
}
