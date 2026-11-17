import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Tag } from './Tag';
import { ToggleGroup } from './ToggleGroup';

const topics = ['Brand', 'Product launch', 'Events', 'Retail', 'Other'];

const meta = {
  title: 'Components/Atoms/Tag',
  component: Tag,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'pick topics or filters as pills',
          use: '`Tag` in a `ToggleGroup`',
          not: '`Badge` with `onClick`',
        },
      ],
      purpose: 'A pill people press to pick a topic or filter from a set.',
      useWhen: [
        'Choosing any number of topics, like interests on a form',
        'Quick filters above a list',
      ],
      alternatives: [
        { use: 'Checkbox', when: 'the options need longer labels' },
        { use: 'Badge', when: 'it only shows a status' },
        { use: 'ToggleGroup', when: 'it is a tool in a toolbar' },
      ],
      do: [
        'Group tags in a ToggleGroup with an aria-label',
        'Keep labels to a word or two',
      ],
      dont: ['Use a tag to run an action', 'Mix tags and badges in one row'],
    }),
  },
  args: { children: 'Product launch', onPressedChange: fn() },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const tag = canvas.getByRole('button', { name: /product launch/i });
    await expect(tag).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(tag);
    await expect(tag).toHaveAttribute('aria-pressed', 'true');
    await expect(args.onPressedChange).toHaveBeenLastCalledWith(
      true,
      expect.anything(),
    );
  },
};

export const InAGroup: Story = {
  render: () => (
    <ToggleGroup
      multiple
      defaultValue={['Events']}
      aria-label="Topics"
      className="flex-wrap border-0 bg-transparent p-0"
    >
      {topics.map((topic) => (
        <Tag key={topic} value={topic}>
          {topic}
        </Tag>
      ))}
    </ToggleGroup>
  ),
  play: async ({ canvas, userEvent }) => {
    const brand = canvas.getByRole('button', { name: 'Brand' });
    await userEvent.click(brand);
    await expect(brand).toHaveAttribute('aria-pressed', 'true');
    await expect(
      canvas.getByRole('button', { name: 'Events' }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const Disabled: Story = { args: { disabled: true } };
