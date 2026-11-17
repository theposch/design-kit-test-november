import { Box } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import { Center } from '#components/atoms/Center';
import * as Field from '#components/atoms/Field';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Input } from '#components/atoms/Input';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { TextLink } from '#components/atoms/TextLink';
import { OrDivider } from './parts/OrDivider';

/* Email and password in a card, with social sign-in and a sign-up link. */
export function SignInCard() {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  /* Demo only: every attempt fails after a moment, to show the error. */
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    setTimeout(() => {
      setBusy(false);
      setFailed(true);
    }, 1200);
  }

  return (
    <Center
      height="screen"
      render={<main />}
      className="bg-background text-foreground p-6"
    >
      <Stack gap={4} align="center" className="w-full max-w-sm">
        <Text
          register="body-lg"
          strong
          render={<div />}
          className="flex flex-col items-center gap-2"
        >
          <Icon icon={Box} className="size-8" />
          Northwind
        </Text>

        <Card.Root className="w-full">
          <Card.Body className="tablet:p-8 gap-6">
            <Stack gap={1} align="center">
              <Heading level={1} register="heading-3">
                Welcome back
              </Heading>
              <Text register="body-base" tone="muted">
                Sign in to your account
              </Text>
            </Stack>

            <Stack gap={4} render={<form onSubmit={signIn} noValidate />}>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  size="lg"
                />
              </Field.Root>
              <Field.Root invalid={failed}>
                <Stack direction="row" justify="between" align="baseline">
                  <Field.Label>Password</Field.Label>
                  <Text register="body-xs" render={<span />}>
                    <TextLink href="#reset" tone="muted">
                      Forgot password?
                    </TextLink>
                  </Text>
                </Stack>
                <Input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  size="lg"
                  onChange={() => setFailed(false)}
                />
                {failed && (
                  <Field.Error match>
                    Incorrect password. Try again.
                  </Field.Error>
                )}
              </Field.Root>
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>

            <OrDivider>Or continue with</OrDivider>

            <Stack gap={2}>
              <Button variant="outline" size="lg">
                Continue with Apple
              </Button>
              <Button variant="outline" size="lg">
                Continue with Google
              </Button>
            </Stack>

            <Text register="body-sm" tone="muted" align="center">
              No account yet? <TextLink href="#sign-up">Sign up</TextLink>
            </Text>
          </Card.Body>
        </Card.Root>

        <Text register="body-xs" tone="muted" align="center" balance>
          By continuing you agree to our{' '}
          <TextLink href="#terms">Terms of Service</TextLink> and{' '}
          <TextLink href="#privacy">Privacy Policy</TextLink>.
        </Text>
      </Stack>
    </Center>
  );
}
