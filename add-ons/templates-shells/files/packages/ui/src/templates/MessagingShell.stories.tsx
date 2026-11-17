import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { MessagingShell } from './MessagingShell';

const meta = {
  title: 'Templates/Shells/Messaging',
  component: MessagingShell,
  parameters: {
    ...about(
      'A team chat frame: channels, the conversation and a reply thread side by side, as separate screens on small devices.',
    ),
    a11y: { context: 'body' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof MessagingShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const SendAndOpenThread: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.type(
      canvas.getByLabelText('Message #design'),
      'Looks great, ship it.',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(canvas.getByText('Looks great, ship it.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '2 replies' }));
    await expect(
      canvas.getByRole('complementary', { name: 'Thread' }),
    ).toBeVisible();
  },
};

export const SwitchChannelOnPhone: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'All conversations' }),
    );
    await userEvent.click(canvas.getByRole('link', { name: 'launch' }));
    await expect(
      canvas.getByRole('heading', { level: 1, name: '#launch' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: '2 replies' }));
    const drawer = await screen.findByRole('dialog', { name: 'Thread' });
    await waitFor(() => expect(drawer).toBeVisible());
  },
};
