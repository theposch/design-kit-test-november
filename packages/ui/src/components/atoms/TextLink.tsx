import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { focusRing } from '#lib/focusRing';
import { cn } from '#lib/utils';

/*
 * The underline is what marks it as a link, so it keeps the colour of the
 * sentence around it and still reads as a link without relying on colour.
 */
const textLinkVariants = cva(
  [
    'decoration-current/40 hover:decoration-current rounded-xs underline underline-offset-4 outline-none',
    focusRing,
  ],
  {
    variants: {
      tone: {
        inherit: '',
        muted: 'text-muted-foreground hover:text-foreground',
      },
    },
    defaultVariants: { tone: 'inherit' },
  },
);

type TextLinkProps = useRender.ComponentProps<'a'> &
  VariantProps<typeof textLinkVariants>;

/* A link inside text. `render` swaps in a router's link component. */
export function TextLink({ render, className, tone, ...props }: TextLinkProps) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      { className: cn(textLinkVariants({ tone }), className) },
      props,
    ),
  });
}
