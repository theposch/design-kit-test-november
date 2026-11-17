import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Text } from './Text';
import { TextLink } from './TextLink';

const meta = {
  title: 'Components/Atoms/TextLink',
  component: TextLink,
  parameters: {
    ...usage({
      choose: [{ need: 'link within running text', not: '`LinkButton`' }],
      purpose: 'A link inside a sentence or a line of text.',
      useWhen: [
        'Links in running text, like "agree to our Terms"',
        'Small secondary links such as "Forgot password?"',
      ],
      alternatives: [
        {
          use: 'LinkButton',
          when: 'the link is the main action and should look like a button',
        },
        { use: 'Button', when: 'it does something instead of going somewhere' },
      ],
      do: [
        'Make the link text say where it goes',
        'Use render to plug in your router’s link component',
      ],
      dont: ['Write "click here"', 'Use it to submit forms or open dialogs'],
    }),
    layout: 'centered',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['inherit', 'muted'] },
  },
  args: { href: '#terms', children: 'Terms of Service' },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InSentence: Story = {
  render: (args) => (
    <Text register="body-sm" className="max-w-xs">
      By continuing you agree to our <TextLink {...args} />.
    </Text>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Terms of Service' });
    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};

export const Muted: Story = {
  args: { tone: 'muted', href: '#reset', children: 'Forgot password?' },
  render: (args) => (
    <Text register="body-sm">
      <TextLink {...args} />
    </Text>
  ),
};
