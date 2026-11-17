import { Toggle as BaseToggle } from '@base-ui/react/toggle';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

type TagProps = Omit<BaseToggle.Props, 'className'> & { className?: string };

/*
 * A pill that switches on and off, for picking topics or filters from a
 * set. Put several in a ToggleGroup with `multiple` so they share one value.
 * The pressed state is a fill, so it doesn't rely on colour alone.
 */
export function Tag({ className, ...props }: TagProps) {
  return (
    <BaseToggle
      className={cn(
        focusRing,
        'type-label-sm border-border text-foreground ease-default hover:bg-muted data-pressed:bg-secondary data-pressed:text-secondary-foreground inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 transition-colors duration-(--motion-hover-duration) outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-pressed:border-transparent [&_svg]:size-3.5 [&_svg]:shrink-0',
        className,
      )}
      {...props}
    />
  );
}
