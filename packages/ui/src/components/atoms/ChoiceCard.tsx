import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { focusRingWithin } from '#lib/focusRing';
import { cn } from '#lib/utils';

/*
 * A card people pick by clicking anywhere on it. Put one Radio (or
 * Checkbox) inside, next to the text; the card is its label, and it takes
 * the primary border while its control is checked.
 */
export function ChoiceCard({
  render,
  className,
  ...props
}: useRender.ComponentProps<'label'>) {
  return useRender({
    defaultTagName: 'label',
    render,
    props: mergeProps<'label'>(
      {
        className: cn(
          focusRingWithin,
          'bg-surface text-surface-foreground border-border ease-default hover:bg-muted has-data-checked:border-primary has-data-disabled:pointer-events-none has-data-disabled:opacity-50 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-(--motion-hover-duration)',
          className,
        ),
      },
      props,
    ),
  });
}
