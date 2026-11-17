import { Button } from '#components/atoms/Button';
import * as Toast from '#components/atoms/Toast';
import { useToastManager } from '#hooks/useToastManager';
import { cn } from '#lib/utils';

type ToasterProps = {
  /** Accessible name for the notification region screen readers jump to. */
  label: string;
  /** Accessible name for each toast's dismiss button. */
  closeLabel: string;
  className?: string;
};

/*
 * The drop-in toast stack: mount once inside `Toast.Provider`, then queue
 * toasts from anywhere below it with `useToastManager().add(...)`. A toast's
 * `actionProps` render as a small outline Button.
 */
export function Toaster({ label, closeLabel, className }: ToasterProps) {
  const { toasts } = useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport aria-label={label} className={cn(className)}>
        {toasts.map((toast) => (
          <Toast.Root key={toast.id} toast={toast}>
            <Toast.Content>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Toast.Title />
                <Toast.Description />
                <Toast.Action
                  className="mt-2 self-start"
                  render={<Button variant="outline" size="sm" />}
                />
              </div>
              <Toast.Close aria-label={closeLabel} />
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
