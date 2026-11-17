import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { SignInCard } from './SignInCard';

const meta = {
  title: 'Templates/Sign in/Card',
  component: SignInCard,
  parameters: about(
    'Email and password sign-in in a centred card, with social sign-in, a reset link and an error state.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof SignInCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };
export const WrongPassword: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText('Incorrect password. Try again.'),
    ).not.toBeInTheDocument();
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'not-it');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await expect(
      await canvas.findByText('Incorrect password. Try again.', undefined, {
        timeout: 3000,
      }),
    ).toBeVisible();
  },
};
