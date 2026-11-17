import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { SignInSimple } from './SignInSimple';

const meta = {
  title: 'Templates/Sign in/Simple',
  component: SignInSimple,
  parameters: about(
    'The plainest sign-in: email and password in a card, with a message when a field is empty.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof SignInSimple>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };
export const MissingDetails: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      /email and password/i,
    );
  },
};
