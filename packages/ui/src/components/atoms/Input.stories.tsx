import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Input } from './Input';

const meta = {
  title: 'Components/Atoms/Input',
  component: Input,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'type one line of text (a name, an email)',
          not: '`Textarea`, a bare `<input>`',
        },
      ],
      purpose: 'Single-line text entry: names, emails, search terms.',
      useWhen: ['The answer fits on one line', 'Inside a Field, with a label'],
      alternatives: [
        { use: 'Textarea', when: 'the answer can run over several lines' },
        { use: 'Select', when: 'the answer comes from a fixed list' },
      ],
      do: [
        'Set the right type (email, search, tel) so phones show the right keyboard',
        'Match its size to the buttons beside it',
      ],
      dont: [
        'Rely on the placeholder as the label',
        'Use it for a choice between a few known options',
      ],
    }),
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
  args: { 'aria-label': 'Email address' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: 'name@example.com', onValueChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: /email address/i });
    await userEvent.type(input, 'ada@example.com');
    await expect(input).toHaveValue('ada@example.com');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      'ada@example.com',
      expect.anything(),
    );
  },
};

export const WithLabel: Story = {
  args: { 'aria-label': undefined },
  render: (args) => (
    <label className="type-body-sm text-foreground flex w-72 flex-col gap-1.5">
      Full name
      <Input placeholder="Ada Lovelace" {...args} />
    </label>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('textbox', { name: /full name/i }),
    ).toBeInTheDocument();
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-3">
      <Input {...args} size="sm" placeholder="Small" />
      <Input {...args} size="md" placeholder="Medium" />
      <Input {...args} size="lg" placeholder="Large" />
    </div>
  ),
};

export const Invalid: Story = {
  args: { defaultValue: 'not-an-email', 'aria-invalid': true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeInvalid();
  },
};

export const Disabled: Story = {
  args: { defaultValue: 'Read only for now', disabled: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox');
    await expect(input).toBeDisabled();
    await expect(input).toHaveAttribute('data-disabled');
  },
};
