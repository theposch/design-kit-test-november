import { Image } from 'lucide-react';

import { Icon } from '#components/atoms/Icon';

const SHADES = [
  'from-muted to-secondary',
  'from-secondary to-muted',
  'from-muted to-border',
  'from-border to-secondary',
] as const;

/*
 * Stands in for a photo so templates need no image files or network. When
 * you copy a template, replace each one with an <img src alt> inside the
 * same AspectRatio.
 */
export function DemoImage({ alt, shade = 0 }: { alt: string; shade?: number }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`text-muted-foreground flex items-center justify-center bg-linear-to-br ${SHADES[shade % SHADES.length]}`}
    >
      <Icon icon={Image} className="size-8 opacity-50" />
    </div>
  );
}
