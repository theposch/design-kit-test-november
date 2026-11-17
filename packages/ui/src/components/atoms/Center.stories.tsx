import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Center } from './Center';

const meta = {
  title: 'Components/Atoms/Center',
  component: Center,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'put one thing in the middle of an area',
          not: 'a `div` with hand-written flex',
        },
      ],
      purpose: 'Puts its content in the middle of an area.',
      useWhen: [
        'A sign-in form in the middle of the screen',
        'An empty or loading message in the middle of a panel',
      ],
      alternatives: [
        { use: 'Stack', when: 'several things line up with a gap' },
      ],
      do: [
        'Use height="screen" for a full-page centred layout',
        'Cap the content width inside, e.g. a max-w-sm Stack',
      ],
      dont: [
        'Centre long-form text; it is hard to read',
        'Nest Centers to nudge position',
      ],
    }),
  },
  argTypes: {
    axis: {
      control: 'inline-radio',
      options: ['both', 'horizontal', 'vertical'],
    },
    height: {
      control: 'inline-radio',
      options: ['content', 'parent', 'screen'],
    },
  },
} satisfies Meta<typeof Center>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Both: Story = {
  render: (args) => (
    <div className="border-border h-64 w-96 rounded-lg border border-dashed">
      <Center {...args} height="parent" data-testid="center">
        <span className="type-body-sm">In the middle</span>
      </Center>
    </div>
  ),
  play: async ({ canvas }) => {
    const style = getComputedStyle(canvas.getByTestId('center'));
    await expect(style.alignItems).toBe('center');
    await expect(style.justifyContent).toBe('center');
  },
};

export const FullScreen: Story = {
  args: { height: 'screen' },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <Center {...args} className="p-6">
      <span className="type-body-sm">Centred in the whole window</span>
    </Center>
  ),
};
