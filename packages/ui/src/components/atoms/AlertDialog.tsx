import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';

import { dialogClasses } from '#lib/dialogClasses';
import { cn } from '#lib/utils';

type Stringly<P> = Omit<P, 'className'> & { className?: string };

/*
 * Looks like Dialog but behaves differently: clicking the backdrop does not
 * dismiss it, so the user must answer through one of the actions.
 */
export function Root(props: BaseAlertDialog.Root.Props) {
  return <BaseAlertDialog.Root {...props} />;
}

export function Trigger({
  className,
  ...props
}: Stringly<BaseAlertDialog.Trigger.Props>) {
  return <BaseAlertDialog.Trigger className={cn(className)} {...props} />;
}

export function Portal(props: BaseAlertDialog.Portal.Props) {
  return <BaseAlertDialog.Portal {...props} />;
}

export function Backdrop({
  className,
  ...props
}: Stringly<BaseAlertDialog.Backdrop.Props>) {
  return (
    <BaseAlertDialog.Backdrop
      className={cn(dialogClasses.backdrop, className)}
      {...props}
    />
  );
}

export function Viewport({
  className,
  ...props
}: Stringly<BaseAlertDialog.Viewport.Props>) {
  return <BaseAlertDialog.Viewport className={cn(className)} {...props} />;
}

export function Popup({
  className,
  ...props
}: Stringly<BaseAlertDialog.Popup.Props>) {
  return (
    <BaseAlertDialog.Popup
      className={cn(dialogClasses.popup, className)}
      {...props}
    />
  );
}

export function Title({
  className,
  ...props
}: Stringly<BaseAlertDialog.Title.Props>) {
  return (
    <BaseAlertDialog.Title
      className={cn(dialogClasses.title, className)}
      {...props}
    />
  );
}

export function Description({
  className,
  ...props
}: Stringly<BaseAlertDialog.Description.Props>) {
  return (
    <BaseAlertDialog.Description
      className={cn(dialogClasses.description, className)}
      {...props}
    />
  );
}

export function Close({
  className,
  ...props
}: Stringly<BaseAlertDialog.Close.Props>) {
  return <BaseAlertDialog.Close className={cn(className)} {...props} />;
}
