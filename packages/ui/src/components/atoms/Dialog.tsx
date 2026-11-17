import { Dialog as BaseDialog } from '@base-ui/react/dialog';

import { dialogClasses } from '#lib/dialogClasses';
import { cn } from '#lib/utils';

/*
 * Every part is wrapped, pass-through parts included, so consumers never
 * import from `@base-ui/react` and the library owns the whole surface. Base UI
 * also accepts a state-callback `className`; cn() flattens through clsx, which
 * silently discards function values, so the styled layer admits only strings.
 */
type Stringly<P> = Omit<P, 'className'> & { className?: string };

export function Root(props: BaseDialog.Root.Props) {
  return <BaseDialog.Root {...props} />;
}

export function Trigger({
  className,
  ...props
}: Stringly<BaseDialog.Trigger.Props>) {
  return <BaseDialog.Trigger className={cn(className)} {...props} />;
}

export function Portal(props: BaseDialog.Portal.Props) {
  return <BaseDialog.Portal {...props} />;
}

export function Backdrop({
  className,
  ...props
}: Stringly<BaseDialog.Backdrop.Props>) {
  return (
    <BaseDialog.Backdrop
      className={cn(dialogClasses.backdrop, className)}
      {...props}
    />
  );
}

export function Viewport({
  className,
  ...props
}: Stringly<BaseDialog.Viewport.Props>) {
  return <BaseDialog.Viewport className={cn(className)} {...props} />;
}

export function Popup({
  className,
  ...props
}: Stringly<BaseDialog.Popup.Props>) {
  return (
    <BaseDialog.Popup
      className={cn(dialogClasses.popup, className)}
      {...props}
    />
  );
}

export function Title({
  className,
  ...props
}: Stringly<BaseDialog.Title.Props>) {
  return (
    <BaseDialog.Title
      className={cn(dialogClasses.title, className)}
      {...props}
    />
  );
}

export function Description({
  className,
  ...props
}: Stringly<BaseDialog.Description.Props>) {
  return (
    <BaseDialog.Description
      className={cn(dialogClasses.description, className)}
      {...props}
    />
  );
}

export function Close({
  className,
  ...props
}: Stringly<BaseDialog.Close.Props>) {
  return <BaseDialog.Close className={cn(className)} {...props} />;
}
