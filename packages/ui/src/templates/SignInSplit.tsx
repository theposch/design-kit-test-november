import { CircleCheck, LayoutGrid } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import { Center } from '#components/atoms/Center';
import * as EmptyState from '#components/atoms/EmptyState';
import * as Field from '#components/atoms/Field';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Input } from '#components/atoms/Input';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { TextLink } from '#components/atoms/TextLink';
import { DemoImage } from './parts/DemoImage';
import { OrDivider } from './parts/OrDivider';

/*
 * Sign-in beside a large picture. On phones the picture moves above the form
 * so the form is never squeezed.
 */
export function SignInSplit() {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  /* Demo only: an empty field fails; anything else signs in after a moment. */
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get('email') || !data.get('password')) {
      setFailed(true);
      return;
    }
    setFailed(false);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSignedIn(true);
    }, 1200);
  }

  return (
    <Center
      height="screen"
      render={<main />}
      className="bg-background text-foreground p-6"
    >
      <Stack gap={4} className="w-full max-w-5xl">
        <Card.Root>
          <Grid
            columns={1}
            gap={8}
            className="tablet:grid-cols-2 tablet:p-8 p-4"
          >
            <Stack gap={4}>
              <Text strong render={<div />} className="flex items-center gap-2">
                <Icon icon={LayoutGrid} />
                Northwind
              </Text>

              <Center axis="vertical" className="flex-1">
                {signedIn ? (
                  <EmptyState.Root>
                    <EmptyState.Media>
                      <CircleCheck />
                    </EmptyState.Media>
                    <EmptyState.Title render={<h1 />}>
                      You&apos;re signed in
                    </EmptyState.Title>
                    <EmptyState.Description>
                      Taking you to your dashboard…
                    </EmptyState.Description>
                  </EmptyState.Root>
                ) : (
                  <Stack gap={4}>
                    <Stack gap={1}>
                      <Heading level={1}>Welcome back</Heading>
                      <Text register="body-base" tone="muted">
                        Sign in to your Northwind account
                      </Text>
                    </Stack>

                    <Stack
                      gap={4}
                      render={<form onSubmit={signIn} noValidate />}
                    >
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
                        <Field.Label>Password</Field.Label>
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
                        {failed && (
                          <Text
                            register="body-xs"
                            align="end"
                            render={<span />}
                          >
                            <TextLink href="#reset" tone="muted">
                              Forgot your password?
                            </TextLink>
                          </Text>
                        )}
                      </Field.Root>
                      <Button type="submit" size="lg" disabled={busy}>
                        {busy ? 'Signing in…' : 'Sign in'}
                      </Button>
                    </Stack>

                    <OrDivider>Or continue with</OrDivider>

                    <Grid columns={2} gap={2}>
                      <Button variant="outline" size="lg">
                        Apple
                      </Button>
                      <Button variant="outline" size="lg">
                        Google
                      </Button>
                    </Grid>
                  </Stack>
                )}
              </Center>

              {!signedIn && (
                <Text register="body-sm" tone="muted">
                  No account yet? <TextLink href="#sign-up">Sign up</TextLink>
                </Text>
              )}
            </Stack>

            <div className="max-tablet:-order-1 max-tablet:aspect-video tablet:min-h-120 overflow-hidden rounded-lg *:size-full">
              <DemoImage alt="Two people working together at a desk" />
            </div>
          </Grid>
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
