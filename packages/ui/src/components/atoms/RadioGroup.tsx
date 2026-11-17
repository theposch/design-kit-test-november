import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

import { cn } from '#lib/utils';

type RadioGroupProps = Omit<BaseRadioGroup.Props, 'className'> & {
  /*
   * Base UI also accepts a state-callback form of `className`, but cn()
   * flattens through clsx, which silently discards function values — the
   * styled layer admits only strings so that footgun can't compile.
   */
  className?: string;
};

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <BaseRadioGroup
      className={cn('flex flex-col gap-2 data-disabled:opacity-50', className)}
      {...props}
    />
  );
}
