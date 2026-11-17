import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { WorkItem } from './WorkItem';

const meta = {
  title: 'Templates/Details/Work item',
  component: WorkItem,
  parameters: {
    ...about(
      'One task in a tracker: checklist, files and comments, with editable details beside it or in a dialog.',
    ),
    a11y: { context: 'body' },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof WorkItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const TickAndComment: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('2 of 5 done')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('checkbox', { name: /check the tablet layout/i }),
    );
    await expect(canvas.getByText('3 of 5 done')).toBeVisible();
    await userEvent.type(
      canvas.getByLabelText('Add a comment'),
      'On it today.',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Comment' }));
    await expect(await canvas.findByText('On it today.')).toBeVisible();
  },
};

export const DetailsOnPhone: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show details' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(
      screen.getByRole('combobox', { name: 'Status' }),
    ).toBeInTheDocument();
  },
};
