import { cn } from '#lib/utils';

type SkeletonProps = { className?: string };

/*
 * A grey stand-in shaped like the content that is loading. Size it with
 * classes (`h-4 w-32`, `size-10 rounded-full`). It is hidden from screen
 * readers, so pair a group of them with one Spinner or status message.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('bg-muted rounded-md motion-safe:animate-pulse', className)}
    />
  );
}
