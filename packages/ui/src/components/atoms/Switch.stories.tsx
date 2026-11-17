import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Switch from './Switch';

const meta = {
  title: 'Components/Atoms/Switch',
  component: Switch.Root,
  parameters: {
    ...usage({
      choose: [{ need: 'flip a setting that applies now', not: '`Checkbox`' }],
      purpose: 'Turns a setting on or off, taking effect immediately.',
      useWhen: [
        'The change applies straight away, with no Save button',
        'Settings and preferences',
      ],
      alternatives: [
        { use: 'Checkbox', when: 'the choice is submitted later with a form' },
        {
          use: 'Toggle',
          when: 'a pressed/unpressed button in a toolbar, like Bold',
        },
      ],
      do: [
        'Label it with the setting\'s name, not "On" or "Off"',
        'Show the effect of switching right away',
      ],
      dont: [
        'Use it inside a form that needs a Save button',
        'Use it to choose between two different things',
      ],
    }),
    layout: 'centered',
  },
  args: { onCheckedChange: fn() },
  render: (args) => (
    <label className="type-body-sm text-foreground flex items-center gap-2">
      <Switch.Root {...args}>
        <Switch.Thumb />
      </Switch.Root>
      Dark mode
    </label>
  ),
} satisfies Meta<typeof Switch.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: /dark mode/i });
    await expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(
      true,
      expect.anything(),
    );

    await userEvent.keyboard(' ');
    await expect(toggle).not.toBeChecked();
  },
};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('switch')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};
