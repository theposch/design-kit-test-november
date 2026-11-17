import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as DetailsList from './DetailsList';

const customer = [
  ['Name', 'Ada Moreno'],
  ['Email', 'ada@example.com'],
  ['Address', '12 Harbour Street, Portland'],
  ['Billing', 'Same as shipping'],
];

const meta = {
  title: 'Components/Atoms/DetailsList',
  component: DetailsList.Root,
  parameters: {
    ...usage({
      purpose: 'Label and value pairs, like a customer record or order totals.',
      useWhen: [
        'Showing the facts about one item',
        'A summary of totals, one per row',
      ],
      alternatives: [
        { use: 'List', when: 'each row is its own item' },
        { use: 'Table', when: 'several items share the same labels' },
      ],
      do: [
        'Keep labels short and in the same order on every page',
        'Let it sit in a narrow panel; it stacks by itself',
      ],
      dont: [
        'Put inputs in it; use a form with Field',
        'Leave a value empty; write "None" or "Not set"',
      ],
    }),
  },
} satisfies Meta<typeof DetailsList.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const record = (
  <DetailsList.Root>
    {customer.map(([term, value]) => (
      <DetailsList.Item key={term}>
        <DetailsList.Term>{term}</DetailsList.Term>
        <DetailsList.Value>{value}</DetailsList.Value>
      </DetailsList.Item>
    ))}
  </DetailsList.Root>
);

export const Default: Story = {
  render: () => <div className="w-lg">{record}</div>,
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Email').tagName).toBe('DT');
    await expect(canvas.getByText('ada@example.com').tagName).toBe('DD');
  },
};

/* In a narrow panel each label sits above its value. */
export const Narrow: Story = {
  render: () => <div className="w-72">{record}</div>,
};
