import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Grid } from './Grid';

const meta = {
  title: 'Components/Atoms/Grid',
  component: Grid,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'lay out a grid that reflows',
          not: 'breakpoint-by-breakpoint columns',
        },
      ],
      purpose:
        'Lays items out in columns that drop to fewer columns as the screen narrows.',
      useWhen: [
        'A gallery or list of cards',
        'Side-by-side sections that should stack on a phone',
      ],
      alternatives: [
        { use: 'Stack', when: 'items only need to line up in one direction' },
      ],
      do: [
        'Use columns={{ minWidth, max }} for anything that must work on a phone',
        'Pick minWidth as the narrowest a card still looks right',
      ],
      dont: [
        'Use a fixed number of columns for cards; four tiny columns on a phone',
        'Set widths on the children; the grid sizes them',
      ],
    }),
  },
  argTypes: {
    align: {
      control: 'select',
      options: ['stretch', 'start', 'center', 'end'],
    },
    gap: { control: 'select', options: [0, 1, 2, 4, 6, 8, 10, 12, 16] },
  },
  args: { columns: { minWidth: 240, max: 4 }, gap: 4 },
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

const Cell = ({ n }: { n: number }) => (
  <div className="bg-muted text-foreground type-body-sm rounded-md p-4">
    Item {n}
  </div>
);

const items = Array.from({ length: 8 }, (_, i) => i + 1);
const columnCount = (element: HTMLElement) =>
  getComputedStyle(element).gridTemplateColumns.split(' ').length;

export const Reflowing: Story = {
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div className="w-5xl max-w-full">
        <Grid {...args} data-testid="wide">
          {items.map((n) => (
            <Cell key={n} n={n} />
          ))}
        </Grid>
      </div>
      <div className="w-80">
        <Grid {...args} data-testid="narrow">
          {items.slice(0, 3).map((n) => (
            <Cell key={n} n={n} />
          ))}
        </Grid>
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(columnCount(canvas.getByTestId('narrow'))).toBe(1);
    const wide = canvas.getByTestId('wide');
    if (wide.clientWidth >= 1000) {
      await expect(columnCount(wide)).toBe(4);
    }
  },
};

export const Fixed: Story = {
  args: { columns: 7, gap: 1 },
  render: (args) => (
    <Grid {...args} className="w-96" data-testid="week">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
        <div
          key={i}
          className="bg-muted type-body-xs rounded-sm py-2 text-center"
        >
          {day}
        </div>
      ))}
    </Grid>
  ),
  play: async ({ canvas }) => {
    await expect(columnCount(canvas.getByTestId('week'))).toBe(7);
  },
};
