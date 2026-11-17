import { Button as BaseButton } from '@base-ui/react/button';

import { buttonVariants, type ButtonVariantProps } from '#lib/buttonVariants';
import { cn } from '#lib/utils';

type ButtonProps = Omit<BaseButton.Props, 'className'> &
  ButtonVariantProps & {
    /*
     * Base UI also accepts a state-callback form of `className`, but cn()
     * flattens through clsx, which silently discards function values — the
     * styled layer admits only strings so that footgun can't compile.
     */
    className?: string;
  };

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <BaseButton
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
