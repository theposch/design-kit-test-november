import { useState, type FormEvent, type ReactNode } from 'react';

import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Field from '#components/atoms/Field';
import { Input } from '#components/atoms/Input';
import { Spinner } from '#components/atoms/Spinner';
import { Stack } from '#components/atoms/Stack';

export type SignInValues = { email: string; password: string };

type SignInFormProps = {
  /** Signs the person in. Reject the promise to show `failedError`. */
  onSubmit: (values: SignInValues) => Promise<void>;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  /** Read out while the sign-in is under way ("Signing in"). */
  busyLabel: string;
  /** Shown under a field left empty. */
  requiredError: string;
  /** Shown under the email when it isn't an address. */
  emailError: string;
  /** Shown above the fields when `onSubmit` rejects. */
  failedError: string;
  /** Sits between the password and the button, e.g. a "Forgot password?" link. */
  children?: ReactNode;
  className?: string;
};

type Problems = { email?: 'required' | 'invalid'; password?: 'required' };

/*
 * Email and password with their own checks: empty and mistyped fields are
 * flagged next to the field, a rejected sign-in is flagged above the form,
 * and the button waits while `onSubmit` runs. The app owns what signing in
 * means; this owns the form's states.
 */
export function SignInForm({
  onSubmit,
  emailLabel,
  passwordLabel,
  submitLabel,
  busyLabel,
  requiredError,
  emailError,
  failedError,
  children,
  className,
}: SignInFormProps) {
  const [problems, setProblems] = useState<Problems>({});
  const [status, setStatus] = useState<'idle' | 'busy' | 'failed'>('idle');
  const busy = status === 'busy';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = event.currentTarget.elements;
    const emailField = fields.namedItem('email');
    const passwordField = fields.namedItem('password');
    if (
      !(emailField instanceof HTMLInputElement) ||
      !(passwordField instanceof HTMLInputElement)
    ) {
      return;
    }
    const email = emailField.value.trim();
    const password = passwordField.value;
    const found: Problems = {
      email: !email
        ? 'required'
        : emailField.validity.typeMismatch
          ? 'invalid'
          : undefined,
      password: !password ? 'required' : undefined,
    };
    setProblems(found);
    if (found.email ?? found.password) {
      (found.email ? emailField : passwordField).focus();
      return;
    }
    setStatus('busy');
    try {
      await onSubmit({ email, password });
      setStatus('idle');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <Stack
      gap={4}
      render={
        <form
          noValidate
          onSubmit={(event) => {
            void submit(event);
          }}
        />
      }
      className={className}
    >
      {status === 'failed' && (
        <Banner.Root status="destructive">
          <Banner.Description>{failedError}</Banner.Description>
        </Banner.Root>
      )}
      <Field.Root invalid={Boolean(problems.email)}>
        <Field.Label>{emailLabel}</Field.Label>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          onChange={() => setProblems(({ password }) => ({ password }))}
        />
        {problems.email && (
          <Field.Error match>
            {problems.email === 'required' ? requiredError : emailError}
          </Field.Error>
        )}
      </Field.Root>
      <Field.Root invalid={Boolean(problems.password)}>
        <Field.Label>{passwordLabel}</Field.Label>
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          onChange={() => setProblems(({ email }) => ({ email }))}
        />
        {problems.password && <Field.Error match>{requiredError}</Field.Error>}
      </Field.Root>
      {children}
      <Button type="submit" disabled={busy} focusableWhenDisabled>
        {busy && <Spinner label={busyLabel} />}
        {submitLabel}
      </Button>
    </Stack>
  );
}
