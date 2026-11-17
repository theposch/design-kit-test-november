import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';

import { Text } from '#components/atoms/Text';
import { TextLink } from '#components/atoms/TextLink';
import { usage } from '#storybook/usage';
import { SignInForm } from './SignInForm';

const meta = {
  title: 'Components/Organisms/SignInForm',
  component: SignInForm,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'sign in with an email and password',
          not: 'fields and a button wired up again on each page',
        },
      ],
      purpose:
        'An email and password form that checks its fields, waits while the app signs the person in, and says when it failed.',
      useWhen: [
        'A sign-in page or dialog that takes an email and a password',
        'The app decides what signing in means and the form only needs to report the result',
      ],
      alternatives: [
        {
          use: 'Field with Input',
          when: 'the form asks for anything else; build it from the atoms',
        },
        {
          use: 'Button',
          when: 'sign-in is a single click, such as "Continue with Google"',
        },
      ],
      do: [
        'Reject the promise from onSubmit when sign-in fails, so the form can say so',
        'Pass every message in; the form has no words of its own',
      ],
      dont: [
        'Show the failure in a toast as well; the banner above the fields is enough',
        'Put sign-up or reset fields inside it; those are separate forms',
      ],
    }),
    layout: 'centered',
  },
  args: {
    onSubmit: fn(async () => {}),
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitLabel: 'Sign in',
    busyLabel: 'Signing in',
    requiredError: 'Fill this in to continue.',
    emailError: 'Enter an email address, like name@company.com.',
    failedError: 'That email and password do not match. Try again.',
    className: 'w-80',
  },
} satisfies Meta<typeof SignInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'correct horse');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(args.onSubmit).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'correct horse',
      }),
    );
  },
};

export const EmptyFields: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(canvas.getAllByText('Fill this in to continue.')).toHaveLength(2),
    );
    await expect(canvas.getByLabelText('Email')).toHaveFocus();
    await expect(canvas.getByLabelText('Email')).toBeInvalid();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const MistypedEmail: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const email = canvas.getByLabelText('Email');
    await userEvent.type(email, 'ada');
    await userEvent.type(canvas.getByLabelText('Password'), 'correct horse');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(
        canvas.getByText('Enter an email address, like name@company.com.'),
      ).toBeVisible(),
    );
    await expect(args.onSubmit).not.toHaveBeenCalled();

    await userEvent.type(email, '@example.com');
    await waitFor(() =>
      expect(
        canvas.queryByText('Enter an email address, like name@company.com.'),
      ).not.toBeInTheDocument(),
    );
  },
};

export const Busy: Story = {
  args: { onSubmit: fn(() => new Promise<void>(() => {})) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'correct horse');
    await userEvent.click(canvas.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Signing in' })).toBeVisible(),
    );
    const button = canvas.getByRole('button', { name: /sign in/i });
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveFocus();
  },
};

export const Failed: Story = {
  args: {
    onSubmit: fn(() => Promise.reject(new Error('Wrong password'))),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'wrong');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(canvas.getByRole('alert')).toHaveTextContent(
        'That email and password do not match. Try again.',
      ),
    );
    await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  },
};

export const WithResetLink: Story = {
  args: {
    children: (
      <Text register="body-sm">
        <TextLink href="#reset">Forgot password?</TextLink>
      </Text>
    ),
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('link', { name: 'Forgot password?' }),
    ).toBeVisible();
  },
};
