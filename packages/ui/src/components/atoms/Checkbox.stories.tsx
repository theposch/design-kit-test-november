import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Checkbox from './Checkbox';

const meta = {
  title: 'Components/Atoms/Checkbox',
  component: Checkbox.Root,
  parameters: {
    ...usage({
      choose: [
        { need: 'pick several options', not: '`Switch`, `ToggleGroup`' },
      ],
      purpose:
        'Turns one independent option on or off, or picks several from a list.',
      useWhen: [
        'Several options can be chosen together',
        'A single opt-in that takes effect when the form is submitted',
      ],
      alternatives: [
        {
          use: 'Switch',
          when: 'the change takes effect immediately, like a setting',
        },
        { use: 'Radio', when: 'only one option of the set may be chosen' },
      ],
      do: [
        'Label every checkbox; the label is clickable too',
        'Use Field to attach a description or error',
      ],
      dont: [
        'Use it for choices that exclude each other',
        'Word it so that unchecked means yes',
      ],
    }),
    layout: 'centered',
  },
  args: { onCheckedChange: fn() },
  render: (args) => (
    <label className="type-body-sm text-foreground flex items-center gap-2">
      <Checkbox.Root {...args}>
        <Checkbox.Indicator />
      </Checkbox.Root>
      Email me product updates
    </label>
  ),
} satisfies Meta<typeof Checkbox.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', {
      name: /email me product updates/i,
    });
    await expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(
      true,
      expect.anything(),
    );

    await userEvent.keyboard(' ');
    await expect(checkbox).not.toBeChecked();
  },
};

export const LabelClick: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText(/email me product updates/i));
    await expect(canvas.getByRole('checkbox')).toBeChecked();
  },
};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox')).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultChecked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('checkbox')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};
