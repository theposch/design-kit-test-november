/*
 * Shared by `Dialog` and `AlertDialog` so the two read as one family. Atoms
 * may not compose each other, so the shared look lives here rather than in
 * either component, the same way `buttonVariants` serves Button and
 * LinkButton.
 */
export const dialogClasses = {
  backdrop:
    'bg-background/80 ease-default fixed inset-0 min-h-dvh transition-opacity duration-(--motion-duration-normal) data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute',
  popup:
    'border-border bg-surface text-surface-foreground ease-default fixed top-1/2 left-1/2 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border p-6 shadow-lg transition-[opacity,scale] duration-(--motion-duration-normal) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
  title: 'type-heading-4 text-surface-foreground',
  description: 'type-body-sm text-muted-foreground',
};
