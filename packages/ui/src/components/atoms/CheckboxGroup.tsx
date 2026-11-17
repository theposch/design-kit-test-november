import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group';

import { cn } from '#lib/utils';

type CheckboxGroupProps = Omit<BaseCheckboxGroup.Props, 'className'> & {
  className?: string;
};

/* Holds several Checkboxes as one value: the list of ticked options. */
export function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return (
    <BaseCheckboxGroup
      className={cn('flex flex-col items-start gap-3', className)}
      {...props}
    />
  );
}
