import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, Bell, Heart, Search } from 'lucide-react';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Button } from './Button';
import { Heading } from './Heading';
import { Icon } from './Icon';
import { Text } from './Text';

const meta = {
  title: 'Components/Atoms/Icon',
  component: Icon,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'show an icon',
          use: '`Icon` with a Lucide icon',
          not: 'an inline `<svg>`, an icon font',
        },
      ],
      purpose:
        'Shows a Lucide icon sized and coloured to match the text around it.',
      useWhen: [
        'Next to a label, to help people scan',
        'On its own, when its meaning is clear and it has a label',
      ],
      alternatives: [
        { use: 'Avatar', when: 'it shows a person or an account' },
      ],
      do: [
        'Give a standalone icon a label for screen readers',
        'Change its size by changing the text size around it',
      ],
      dont: [
        'Label an icon that sits next to text saying the same thing',
        'Mix in icons from another set; the strokes will not match',
      ],
    }),
    layout: 'centered',
  },
  args: { icon: Bell },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  render: (args) => (
    <Text render={<span />} className="flex items-center gap-2">
      <Icon {...args} />
      Notifications
    </Text>
  ),
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector('svg');
    await expect(svg).toHaveAttribute('aria-hidden', 'true');
  },
};

export const Labelled: Story = {
  args: { icon: Heart, label: 'Favourite' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'Favourite' })).toBeVisible();
  },
};

export const FollowsTextSize: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Text
        register="body-sm"
        render={<span />}
        className="flex items-center gap-2"
      >
        <Icon icon={Search} /> Small text
      </Text>
      <Heading level={2} className="flex items-center gap-2">
        <Icon icon={Search} /> Heading
      </Heading>
      <Button>
        Continue <Icon icon={ArrowRight} />
      </Button>
    </div>
  ),
};
