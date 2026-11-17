import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as List from './List';
import { Thumbnail } from './Thumbnail';

const items = [
  { name: 'Stoneware mug', detail: 'Glaze: Snow', price: '$28.00', qty: 2 },
  { name: 'Serving bowl', detail: 'Glaze: Sage', price: '$46.00', qty: 1 },
  { name: 'Side plate', detail: 'Glaze: Oat', price: '$18.00', qty: 4 },
];

const meta = {
  title: 'Components/Atoms/List',
  component: List.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'show rows of items or label/value facts',
          use: '`List` / `DetailsList`',
          not: 'a `div` stack, a table for one item',
        },
      ],
      purpose:
        'Rows of like items with a rule between them: order lines, files, people.',
      useWhen: [
        'A short set of items, each with a title and a detail line',
        'Rows with a picture at the start and a figure at the end',
      ],
      alternatives: [
        { use: 'DetailsList', when: 'each row is a label and its value' },
        { use: 'Table', when: 'people compare many columns' },
        { use: 'Grid of Cards', when: 'pictures matter more than text' },
      ],
      do: [
        'Keep every row in the same order: picture, text, figure',
        'Truncate long titles rather than wrapping them',
      ],
      dont: [
        'Put more than one action at the end of a row',
        'Use a list for a page layout',
      ],
    }),
  },
} satisfies Meta<typeof List.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <List.Root className="w-96">
      {items.map((item) => (
        <List.Item key={item.name}>
          <Thumbnail>
            <span className="from-muted to-secondary bg-linear-to-br" />
          </Thumbnail>
          <List.Content>
            <List.Title>{item.name}</List.Title>
            <List.Description>{item.detail}</List.Description>
          </List.Content>
          <List.End>
            <span className="type-body-sm type-strong">{item.price}</span>
            <span className="type-body-xs text-muted-foreground">
              Qty {item.qty}
            </span>
          </List.End>
        </List.Item>
      ))}
    </List.Root>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('list')).toBeVisible();
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
  },
};
