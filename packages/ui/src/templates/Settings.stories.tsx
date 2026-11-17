import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { Settings } from './Settings';

const meta = {
  title: 'Templates/Settings/Account',
  component: Settings,
  parameters: about(
    'Account settings: sections down the side (tabs on small screens), a card per group, each with its own save.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const SaveProfile: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save profile' }));
    await expect(await canvas.findByRole('status')).toHaveTextContent('Saved');
  },
};

export const PasswordsDoNotMatch: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Security' }));
    await userEvent.type(
      await canvas.findByLabelText('New password'),
      'a long new password',
    );
    await userEvent.type(canvas.getByLabelText('Type it again'), 'different');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change password' }),
    );
    await expect(
      await canvas.findByText('The two new passwords do not match.'),
    ).toBeVisible();
  },
};
