import { Separator } from '#components/atoms/Separator';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';

/* A rule with a few words in the middle: "Or continue with". */
export function OrDivider({ children }: { children: string }) {
  return (
    <Stack direction="row" align="center" gap={2}>
      <Separator className="flex-1" />
      <Text register="body-xs" tone="muted" render={<span />}>
        {children}
      </Text>
      <Separator className="flex-1" />
    </Stack>
  );
}
