import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { about } from '#storybook/templates';
import { at } from '#storybook/viewports';
import { ProductDetail } from './ProductDetail';

const meta = {
  title: 'Templates/Commerce/Product',
  component: ProductDetail,
  parameters: about(
    'A product page: a photo gallery beside price, colour and size choices, quantity, and folding details.',
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  },
} satisfies Meta<typeof ProductDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { globals: at('desktop') };
export const Tablet: Story = { globals: at('tablet') };
export const Phone: Story = { globals: at('phone') };

export const ChooseAndAdd: Story = {
  globals: at('desktop'),
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: /show photo 3/i }),
    );
    await expect(
      canvas.getAllByRole('img', { name: 'The collar up close' })[0],
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Add to bag' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Choose a size.');
    await userEvent.click(canvas.getByRole('button', { name: 'M' }));
    await userEvent.click(canvas.getByRole('button', { name: 'One more' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Add to bag' }));
    await expect(
      await canvas.findByText('Added 2 Moss jacket in M to your bag.'),
    ).toBeVisible();
  },
};
