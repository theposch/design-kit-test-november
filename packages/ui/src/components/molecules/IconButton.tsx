import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Button } from '#components/atoms/Button';
import * as Tooltip from '#components/atoms/Tooltip';
import { cn } from '#lib/utils';

type IconButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  /** Any icon from lucide-react. */
  icon: LucideIcon;
  /** What the button does ("Show panel"). Screen readers read it, and it shows as a tooltip. */
  label: string;
};

/*
 * A square button with only an icon. Because the icon alone can be unclear,
 * the label is required and appears as a tooltip on hover and focus.
 */
export function IconButton({
  icon: Glyph,
  label,
  variant = 'ghost',
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <Button
            variant={variant}
            aria-label={label}
            className={cn('aspect-square px-0', className)}
            {...props}
          />
        }
      >
        <Glyph aria-hidden />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Popup>{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
