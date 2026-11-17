import { Separator as BaseSeparator } from '@base-ui/react/separator';

import { cn } from '#lib/utils';

type SeparatorProps = Omit<BaseSeparator.Props, 'className'> & {
  className?: string;
};

export function Separator({ className, ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      className={cn(
        'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch',
        className,
      )}
      {...props}
    />
  );
}
