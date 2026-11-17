import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { SignInSso } from './SignInSso';

const meta = {
  title: 'Templates/Sign in/Single sign-on',
  component: SignInSso,
  parameters: about(
    'Email first: company addresses continue to their sign-on provider, others to a password.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof SignInSso>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };
export const CompanyEmail: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.type(
      canvas.getByLabelText('Work email'),
      'you@northwind.com',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(
      canvas.getByRole('heading', { name: 'Sign in with Okta' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Use a different email' }),
    );
    await expect(canvas.getByLabelText('Work email')).toBeVisible();
  },
};

export const OtherEmail: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.type(
      canvas.getByLabelText('Work email'),
      'ada@example.com',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }));
    await expect(
      canvas.getByRole('heading', { name: 'Enter your password' }),
    ).toBeVisible();
  },
};
