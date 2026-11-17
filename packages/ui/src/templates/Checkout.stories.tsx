import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { Checkout } from './Checkout';

const meta = {
  title: 'Templates/Commerce/Checkout',
  component: Checkout,
  parameters: about(
    'A four-step checkout with an order summary that sits beside the form, or folds away above it on small screens.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof Checkout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const ChangeQuantity: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('$156.00').length).toBeGreaterThan(0);
    await userEvent.click(
      canvas.getByRole('button', { name: 'More Oak serving board' }),
    );
    await expect(canvas.getAllByText('$220.00').length).toBeGreaterThan(0);
  },
};

export const PlaceOrder: Story = {
  globals: at('phone'),
  play: async ({ canvas }) => {
    const go = (name: RegExp) =>
      userEvent.click(canvas.getByRole('button', { name }));
    await go(/continue to shipping/i);
    await go(/continue to delivery/i);
    await expect(
      await canvas.findByText('Enter a street address.'),
    ).toBeVisible();
    await userEvent.type(canvas.getByLabelText('Full name'), 'Ada Moreno');
    await userEvent.type(
      canvas.getByLabelText('Street address'),
      '12 Harbour Street',
    );
    await go(/continue to delivery/i);
    await userEvent.click(canvas.getByRole('radio', { name: /express/i }));
    await go(/continue to payment/i);
    await userEvent.type(
      canvas.getByLabelText('Card number'),
      '4242 4242 4242 4242',
    );
    await go(/pay \$165\.00/i);
    await expect(await canvas.findByText(/order placed/i)).toBeVisible();
  },
};
