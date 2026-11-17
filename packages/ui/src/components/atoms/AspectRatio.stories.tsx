import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { AspectRatio } from './AspectRatio';

const meta = {
  title: 'Components/Atoms/AspectRatio',
  component: AspectRatio,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'keep a picture or video in a fixed shape',
          not: 'a fixed height, a padding trick',
        },
      ],
      purpose:
        'Keeps an image or video at a fixed shape as its width changes, cropping to fit.',
      useWhen: [
        'Images in cards and galleries, so rows line up',
        'Video embeds and hero images',
      ],
      alternatives: [
        {
          use: 'Avatar',
          when: 'a person or account picture in a circle',
        },
      ],
      do: [
        'Put the img directly inside; it fills and crops to the shape',
        'Write alt text that says what the image shows',
      ],
      dont: [
        'Set a height on the image; the ratio decides it',
        'Use it for icons',
      ],
    }),
  },
  argTypes: {
    ratio: {
      control: 'select',
      options: ['1/1', '16/9', '3/2', '4/3', '3/4', '4/5', '9/16'],
    },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Widescreen: Story = {
  render: (args) => (
    <div className="w-96">
      <AspectRatio {...args} data-testid="frame">
        <div className="from-muted to-secondary bg-linear-to-br" />
      </AspectRatio>
    </div>
  ),
  play: async ({ canvas }) => {
    const { width, height } = canvas
      .getByTestId('frame')
      .getBoundingClientRect();
    await expect(Math.round((width / height) * 100)).toBe(178);
  },
};

export const Ratios: Story = {
  render: () => (
    <div className="flex items-start gap-4">
      {(['1/1', '4/3', '3/4'] as const).map((ratio) => (
        <div key={ratio} className="w-32">
          <AspectRatio ratio={ratio}>
            <div className="bg-muted text-foreground type-body-xs flex items-center justify-center">
              {ratio}
            </div>
          </AspectRatio>
        </div>
      ))}
    </div>
  ),
};
