import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Heading } from './Heading';

const meta = {
  title: 'Components/Atoms/Heading',
  component: Heading,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'set a heading or a paragraph',
          use: '`Heading` / `Text`',
          not: 'a bare `<h2>` with `type-*` classes',
        },
      ],
      purpose:
        'A title for a page or section, with its place in the outline set apart from its look.',
      useWhen: [
        'The page title (level 1, once per page)',
        'Section and card titles',
      ],
      alternatives: [{ use: 'Text', when: 'it is body copy, however short' }],
      do: [
        'Choose level for the outline: h1, then h2 inside it, then h3',
        'Use register to change the look, e.g. a card title at level 3 with register="heading-4"',
      ],
      dont: [
        'Skip levels to get a smaller size; change register instead',
        'Use more than one level 1 on a page',
      ],
    }),
  },
  argTypes: {
    level: { control: 'select', options: [1, 2, 3, 4, 5, 6] },
    register: {
      control: 'select',
      options: ['heading-1', 'heading-2', 'heading-3', 'heading-4'],
    },
    tone: { control: 'inline-radio', options: ['inherit', 'muted'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
  },
  args: { level: 2, children: 'Make every day a little brighter' },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('heading', { level: 2 })).toBeVisible();
  },
};

export const Levels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={1}>Level 1, the page title</Heading>
      <Heading level={2}>Level 2, a section</Heading>
      <Heading level={3}>Level 3, a subsection</Heading>
      <Heading level={4}>Level 4, a card title</Heading>
    </div>
  ),
};

export const LookApartFromLevel: Story = {
  args: { level: 3, register: 'heading-1' },
  play: async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 3 });
    await expect(heading).toHaveClass('type-heading-1');
  },
};
