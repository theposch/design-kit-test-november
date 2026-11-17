import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';
import { Stack } from './Stack';

const meta = {
  title: 'Components/Atoms/Stack',
  component: Stack,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'lay things out in a row or column',
          not: 'a `div` with hand-written flex',
        },
      ],
      purpose:
        'Lines children up in a column or a row with an even gap between them.',
      useWhen: [
        'Spacing a heading, text and actions apart',
        'A row of buttons, or a row that becomes a column on phones',
      ],
      alternatives: [
        {
          use: 'Grid',
          when: 'items should line up in columns as well as rows',
        },
        { use: 'Center', when: 'one thing sits in the middle of an area' },
      ],
      do: [
        'Use gap for the space between children, not margins on them',
        'Use columnBelow="tablet" for rows that would be cramped on a phone',
      ],
      dont: [
        'Nest stacks only to add padding; use className="p-6"',
        'Use it for a grid of cards; that is Grid',
      ],
    }),
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['column', 'row'] },
    align: {
      control: 'select',
      options: ['stretch', 'start', 'center', 'end', 'baseline'],
    },
    justify: {
      control: 'select',
      options: ['start', 'center', 'end', 'between'],
    },
    columnBelow: {
      control: 'inline-radio',
      options: ['never', 'tablet', 'desktop'],
    },
    gap: { control: 'select', options: [0, 1, 2, 4, 6, 8, 10, 12, 16] },
  },
  args: { gap: 4 },
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ label }: { label: string }) => (
  <div className="bg-muted text-foreground type-body-sm rounded-md px-4 py-2">
    {label}
  </div>
);

export const Column: Story = {
  render: (args) => (
    <Stack {...args} data-testid="stack">
      <Box label="First" />
      <Box label="Second" />
      <Box label="Third" />
    </Stack>
  ),
  play: async ({ canvas }) => {
    const stack = canvas.getByTestId('stack');
    await expect(getComputedStyle(stack).flexDirection).toBe('column');
    await expect(getComputedStyle(stack).rowGap).toBe('16px');
  },
};

export const Row: Story = {
  args: { direction: 'row', align: 'center', gap: 2 },
  render: (args) => (
    <Stack {...args}>
      <Button>Save</Button>
      <Button variant="outline">Cancel</Button>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const [save, cancel] = canvas.getAllByRole('button');
    await expect(save.getBoundingClientRect().top).toBe(
      cancel.getBoundingClientRect().top,
    );
  },
};

export const SpaceBetween: Story = {
  args: { direction: 'row', justify: 'between', align: 'center' },
  render: (args) => (
    <Stack {...args} className="w-96">
      <Box label="Title" />
      <Button size="sm">Action</Button>
    </Stack>
  ),
};

export const Wrapping: Story = {
  args: { direction: 'row', gap: 2, wrap: true },
  render: (args) => (
    <Stack {...args} className="w-64">
      {['Design', 'Code', 'Review', 'Ship', 'Learn', 'Repeat'].map((tag) => (
        <Box key={tag} label={tag} />
      ))}
    </Stack>
  ),
};

export const AsList: Story = {
  args: { gap: 2, render: <ul /> },
  render: (args) => (
    <Stack {...args}>
      <li className="type-body-sm">Rendered as a list</li>
      <li className="type-body-sm">so screen readers count the items</li>
    </Stack>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
  },
};
