import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { SignInSplit } from './SignInSplit';

const meta = {
  title: 'Templates/Sign in/Split',
  component: SignInSplit,
  parameters: about(
    'Sign-in beside a large picture, with social sign-in and a signed-in state. On phones the picture sits above the form.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof SignInSplit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };
export const SignedIn: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Email'), 'ada@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'correct-horse');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await expect(
      await canvas.findByRole(
        'heading',
        { name: /signed in/i },
        { timeout: 3000 },
      ),
    ).toBeVisible();
  },
};
