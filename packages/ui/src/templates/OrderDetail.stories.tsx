import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { OrderDetail } from './OrderDetail';

const meta = {
  title: 'Templates/Details/Order',
  component: OrderDetail,
  parameters: about(
    'One order in full: header with status and tabs, items, invoice and timeline, and a details panel that sits beside the content on desktop and opens over it on smaller screens.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof OrderDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const HidePanel: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('complementary', { name: 'Order details' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Hide order details' }),
    );
    await expect(
      canvas.queryByRole('complementary', { name: 'Order details' }),
    ).not.toBeInTheDocument();
  },
};

export const PanelOnPhone: Story = {
  globals: at('phone'),
  parameters: { a11y: { context: 'body' } },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: 'Show order details' }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Order details' });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  },
};

export const TimelineTab: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('tab', { name: 'Timeline' }));
    await waitFor(() =>
      expect(canvas.getByRole('tabpanel')).toHaveTextContent(/gift wrapped/i),
    );
    await expect(
      canvas.queryByRole('region', { name: 'Items' }),
    ).not.toBeInTheDocument();
  },
};
