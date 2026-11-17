import type { LucideIcon, LucideProps } from 'lucide-react';

import { cn } from '#lib/utils';

type IconProps = Omit<LucideProps, 'className' | 'ref'> & {
  /** Any icon from lucide-react, e.g. `import { Search } from 'lucide-react'`. */
  icon: LucideIcon;
  /**
   * What the icon means, for screen readers. Leave it out when text next to
   * the icon already says it; the icon is then hidden from them.
   */
  label?: string;
  className?: string;
};

/*
 * Sized by the text around it (--spacing-icon), so an icon in a heading
 * grows with the heading. Colour follows the text too.
 */
export function Icon({ icon: Glyph, label, className, ...props }: IconProps) {
  return (
    <Glyph
      aria-hidden={label === undefined}
      aria-label={label}
      role={label === undefined ? undefined : 'img'}
      className={cn('size-icon shrink-0', className)}
      {...props}
    />
  );
}
