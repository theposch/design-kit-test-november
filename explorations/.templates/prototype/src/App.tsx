import { Button, Heading, Stack, Text } from '@repo/ui';

import { useScreen } from './useScreen';

/*
 * One block per screen in prototype.json. The viewer opens a screen by its
 * id (#start, #next), so every screen listed there needs a block here.
 */
/*
 * The viewer tells the prototype how much room its frame takes (status bar,
 * camera cut-out, home bar), upright or on its side, as a real phone does.
 */
const SAFE_AREA = {
  padding: [
    'calc(var(--safe-top, 0px) + 24px)',
    'calc(var(--safe-right, 0px) + 24px)',
    'calc(var(--safe-bottom, 0px) + 24px)',
    'calc(var(--safe-left, 0px) + 24px)',
  ].join(' '),
};

export function App() {
  const [screen, go] = useScreen();

  return (
    <main
      className="bg-background text-foreground flex min-h-svh flex-col"
      style={SAFE_AREA}
    >
      {screen === 'start' && (
        <Stack gap={6} className="flex-1 justify-end">
          <Heading level={1}>__NAME__</Heading>
          <Text tone="muted">The first screen. Make it yours.</Text>
          <Button onClick={() => go('next')}>Continue</Button>
        </Stack>
      )}

      {screen === 'next' && (
        <Stack gap={6}>
          <Heading level={1}>The next screen</Heading>
          <Button variant="outline" onClick={() => go('start')}>
            Back
          </Button>
        </Stack>
      )}
    </main>
  );
}
