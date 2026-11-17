import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { buttonVariants, type ButtonVariantProps } from '#lib/buttonVariants';
import { cn } from '#lib/utils';

/*
 * A link dressed as a button. It is deliberately not `Button` with
 * `render={<a />}`: Base UI's button enforces button semantics (role,
 * Space/Enter handling, disabled state) and its docs forbid putting those on
 * an anchor. This is a plain `<a>` wearing Button's recipe, with a `render`
 * prop so a consumer can substitute its router's link component.
 */
type LinkButtonProps = useRender.ComponentProps<'a'> & ButtonVariantProps;

export function LinkButton({
  render,
  className,
  variant,
  size,
  ...props
}: LinkButtonProps) {
  return useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      { className: cn(buttonVariants({ variant, size, className })) },
      props,
    ),
  });
}
