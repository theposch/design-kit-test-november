import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';

import { cn } from '#lib/utils';

type ToggleGroupProps = Omit<BaseToggleGroup.Props, 'className'> & {
  className?: string;
};

export function ToggleGroup({ className, ...props }: ToggleGroupProps) {
  return (
    <BaseToggleGroup
      className={cn(
        'border-border bg-background inline-flex items-center gap-1 rounded-lg border p-1 data-disabled:opacity-50 data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    />
  );
}
