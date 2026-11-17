import {
  useRef,
  useState,
  type ComponentProps,
  type DragEvent,
  type ReactNode,
} from 'react';

import { focusRingWithin } from '#lib/focusRing';
import { cn } from '#lib/utils';

type FileDropProps = Omit<ComponentProps<'input'>, 'type' | 'className'> & {
  /** What to show in the zone: an icon, "Drop files or browse", the limits. */
  children: ReactNode;
  className?: string;
};

/*
 * A dashed zone people click to browse for files, or drop files on. It wraps
 * a real file input, so keyboards, screen readers and forms all work as
 * usual; name it with `aria-label` or a Field label.
 */
export function FileDrop({ children, className, ...props }: FileDropProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function drop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setOver(false);
    if (!input.current || props.disabled) return;
    input.current.files = event.dataTransfer.files;
    input.current.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return (
    <label
      data-dragging={over ? '' : undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cn(
        focusRingWithin,
        'border-input bg-background text-muted-foreground type-body-sm ease-default hover:bg-muted data-dragging:border-primary data-dragging:bg-muted flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors duration-(--motion-hover-duration) has-disabled:pointer-events-none has-disabled:opacity-50 [&_svg]:size-6',
        className,
      )}
    >
      <input ref={input} type="file" className="sr-only" {...props} />
      {children}
    </label>
  );
}
