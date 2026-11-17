import { LoaderCircle } from 'lucide-react';

import { cn } from '#lib/utils';

type SpinnerProps = {
  /** What is loading, for screen readers ("Loading orders"). */
  label: string;
  className?: string;
};

/*
 * Shows that something is on its way. Sized by the text around it. With
 * reduced motion it holds still, and the label still announces the wait.
 */
export function Spinner({ label, className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-flex shrink-0', className)}
    >
      <LoaderCircle
        aria-hidden
        className="size-icon motion-safe:animate-spin"
      />
    </span>
  );
}
