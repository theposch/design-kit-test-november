import { Box } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import { Center } from '#components/atoms/Center';
import * as Field from '#components/atoms/Field';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Input } from '#components/atoms/Input';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';

/* The plainest sign-in: email, password, and a message when something is missing. */
export function SignInSimple() {
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  /* Demo only: checks both fields are filled, then pretends to sign in. */
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get('email') || !data.get('password')) {
      setMissing(true);
      return;
    }
    setMissing(false);
    setBusy(true);
    setTimeout(() => setBusy(false), 2000);
  }

  return (
    <Center
      height="screen"
      render={<main />}
      className="bg-background text-foreground p-6"
    >
      <Stack gap={4} align="center" className="w-full max-w-100">
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
          <Card.Body className="tablet:p-8 gap-4">
            <Stack gap={1} align="center">
              <Heading level={1} register="heading-3">
                Sign in
              </Heading>
              <Text register="body-base" tone="muted">
                Enter your details to continue
              </Text>
            </Stack>

            {missing && (
              <Banner.Root status="destructive">
                <Banner.Title>Enter both your email and password.</Banner.Title>
              </Banner.Root>
            )}

            <Stack gap={4} render={<form onSubmit={signIn} noValidate />}>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  size="lg"
                />
              </Field.Root>
              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  size="lg"
                />
              </Field.Root>
              <Button type="submit" size="lg" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Center>
  );
}
