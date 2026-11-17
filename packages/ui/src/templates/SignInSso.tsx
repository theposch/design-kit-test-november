import { ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import * as Avatar from '#components/atoms/Avatar';
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

type Step = 'email' | 'sso' | 'password';

/* Demo data: which email domains sign in through a company provider. */
const PROVIDERS: Record<string, { name: string; initials: string }> = {
  'northwind.com': { name: 'Okta', initials: 'OK' },
  'contoso.com': { name: 'Microsoft Entra', initials: 'ME' },
};

const providerFor = (email: string) =>
  PROVIDERS[email.split('@')[1]?.toLowerCase() ?? ''];

/*
 * Email first: a company address goes on to its single sign-on provider,
 * any other address falls back to a password. Try you@northwind.com.
 */
export function SignInSso() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [failed, setFailed] = useState(false);
  const provider = providerFor(email);

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.includes('@')) return;
    setStep(provider ? 'sso' : 'password');
  }

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailed(true);
  }

  const back = () => {
    setStep('email');
    setFailed(false);
  };

  return (
    <Center
      height="screen"
      render={<main />}
      className="bg-background text-foreground p-6"
    >
      <Card.Root className="w-full max-w-sm">
        <Card.Body className="tablet:p-8 gap-6">
          {step === 'email' && (
            <>
              <Stack gap={1} align="center">
                <Heading level={1} register="heading-3">
                  Welcome back
                </Heading>
                <Text register="body-base" tone="muted" align="center">
                  Enter your work email to sign in
                </Text>
              </Stack>
              <Stack gap={4} render={<form onSubmit={next} noValidate />}>
                <Field.Root>
                  <Field.Label>Work email</Field.Label>
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    size="lg"
                    value={email}
                    onValueChange={setEmail}
                  />
                </Field.Root>
                <Button type="submit" size="lg">
                  Continue
                </Button>
              </Stack>
              <OrDivider>Or sign in with</OrDivider>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep('sso')}
              >
                Single sign-on (SSO)
              </Button>
              <Text register="body-sm" tone="muted" align="center">
                No account yet?{' '}
                <TextLink href="#request-access">Request access</TextLink>
              </Text>
            </>
          )}

          {step === 'sso' && (
            <>
              <Stack gap={2} align="center">
                <Avatar.Root className="size-12">
                  <Avatar.Fallback>
                    {provider?.initials ?? 'SSO'}
                  </Avatar.Fallback>
                </Avatar.Root>
                <Heading level={1} register="heading-3" align="center">
                  Sign in with {provider?.name ?? 'your provider'}
                </Heading>
                <Text register="body-base" tone="muted" align="center">
                  You will come back here once you are signed in.
                </Text>
              </Stack>
              <Stack
                direction="row"
                gap={2}
                align="center"
                className="bg-muted rounded-lg p-4"
              >
                <Icon icon={ShieldCheck} className="text-muted-foreground" />
                <Stack gap={0} className="min-w-0">
                  <Text register="body-sm" strong>
                    {provider?.name ?? 'Single sign-on'}
                  </Text>
                  <Text register="body-sm" tone="muted" lines="1">
                    {email || 'Your work account'}
                  </Text>
                </Stack>
              </Stack>
              <Stack gap={2}>
                <Button size="lg">
                  Continue with {provider?.name ?? 'SSO'}
                </Button>
                <Button variant="ghost" size="lg" onClick={back}>
                  Use a different email
                </Button>
              </Stack>
            </>
          )}

          {step === 'password' && (
            <>
              <Stack gap={1} align="center">
                <Heading level={1} register="heading-3">
                  Enter your password
                </Heading>
                <Text register="body-sm" tone="muted" align="center" lines="1">
                  {email}
                </Text>
              </Stack>
              <Stack gap={4} render={<form onSubmit={signIn} noValidate />}>
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
                </Field.Root>
                <Button type="submit" size="lg">
                  Sign in
                </Button>
                <Button variant="ghost" size="lg" onClick={back}>
                  Use a different email
                </Button>
              </Stack>
            </>
          )}
        </Card.Body>
      </Card.Root>
    </Center>
  );
}
