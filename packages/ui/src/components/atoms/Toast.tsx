import { Toast as BaseToast } from '@base-ui/react/toast';
import { X } from 'lucide-react';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Provider(props: BaseToast.Provider.Props) {
  return <BaseToast.Provider {...props} />;
}

export function Portal(props: BaseToast.Portal.Props) {
  return <BaseToast.Portal {...props} />;
}

/*
 * `aria-label` is required: Base UI otherwise names the region with an
 * English "Notifications" that the consuming app can't translate.
 */
export function Viewport({
  className,
  ...props
}: Stringly<BaseToast.Viewport.Props> & { 'aria-label': string }) {
  return (
    <BaseToast.Viewport
      className={cn(
        'tablet:right-8 tablet:bottom-8 tablet:w-90 fixed right-4 bottom-4 z-50 w-[calc(100vw-2rem)] rounded-lg outline-none',
        focusRing,
        className,
      )}
      {...props}
    />
  );
}

/*
 * The stacking follows Base UI's reference recipe. Collapsed, each toast
 * behind the front one peeks out above it, scaled down by its
 * `--toast-index`. When the viewport is hovered or focused (`data-expanded`)
 * they fan out to their measured `--toast-offset-y`. The `after:` strip
 * bridges the gap between toasts so the pointer never falls through it and
 * collapses the stack mid-hover. Entry, exit and swipe-to-dismiss all
 * translate off the swipe-movement variables.
 */
export function Root({ className, ...props }: Stringly<BaseToast.Root.Props>) {
  return (
    <BaseToast.Root
      className={cn(
        '[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]',
        'border-border bg-surface text-surface-foreground data-[type=error]:border-destructive absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] h-(--height) w-full origin-bottom rounded-lg border shadow-lg outline-none select-none',
        focusRing,
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        '[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))]',
        'data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
        'data-ending-style:opacity-0 data-limited:opacity-0 data-starting-style:[transform:translateY(150%)] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]',
        'data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
        'ease-default transition-[transform,opacity,height] duration-(--motion-duration-slow)',
        className,
      )}
      {...props}
    />
  );
}

export function Content({
  className,
  ...props
}: Stringly<BaseToast.Content.Props>) {
  return (
    <BaseToast.Content
      className={cn(
        'ease-default flex items-start gap-3 overflow-hidden p-4 transition-opacity duration-(--motion-duration-normal) data-behind:opacity-0 data-expanded:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

export function Title({
  className,
  ...props
}: Stringly<BaseToast.Title.Props>) {
  return (
    <BaseToast.Title
      className={cn('type-label-sm text-surface-foreground', className)}
      {...props}
    />
  );
}

export function Description({
  className,
  ...props
}: Stringly<BaseToast.Description.Props>) {
  return (
    <BaseToast.Description
      className={cn('type-body-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function Action({
  className,
  ...props
}: Stringly<BaseToast.Action.Props>) {
  return <BaseToast.Action className={cn(className)} {...props} />;
}

/*
 * Renders an X by default; the consumer supplies the accessible name via
 * `aria-label`, since the library ships no strings.
 */
export function Close({
  className,
  children,
  ...props
}: Stringly<BaseToast.Close.Props>) {
  return (
    <BaseToast.Close
      className={cn(
        focusRing,
        'text-muted-foreground ease-default hover:bg-muted hover:text-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-(--motion-hover-duration) outline-none [&_svg]:size-4',
        className,
      )}
      {...props}
    >
      {children ?? <X aria-hidden />}
    </BaseToast.Close>
  );
}

export function Positioner({
  className,
  ...props
}: Stringly<BaseToast.Positioner.Props>) {
  return <BaseToast.Positioner className={cn(className)} {...props} />;
}

export function Arrow({
  className,
  ...props
}: Stringly<BaseToast.Arrow.Props>) {
  return <BaseToast.Arrow className={cn(className)} {...props} />;
}
