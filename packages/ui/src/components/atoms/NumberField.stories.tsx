import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Field from './Field';
import * as NumberField from './NumberField';

const meta = {
  title: 'Components/Atoms/NumberField',
  component: NumberField.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'type or step a number (seats, quantity)',
          not: '`Input type="number"`',
        },
      ],
      purpose: 'A whole or decimal number, typed or stepped with − and +.',
      useWhen: [
        'A quantity, like seats or items in a cart',
        'A number with a clear minimum and maximum',
      ],
      alternatives: [
        { use: 'Slider', when: 'a rough value matters more than an exact one' },
        { use: 'Input', when: 'it is a code made of digits, like a PIN' },
        { use: 'Select', when: 'only a few set values are allowed' },
      ],
      do: [
        'Set min and max so the buttons stop at the limits',
        'Label it with Field.Label',
      ],
      dont: [
        'Use it for phone or card numbers',
        'Hide the − and + buttons on touch screens',
      ],
    }),
  },
  args: { defaultValue: 2, min: 1, max: 10, onValueChange: fn() },
  render: (args) => (
    <Field.Root className="w-40">
      <Field.Label>Seats</Field.Label>
      <NumberField.Root {...args}>
        <NumberField.Group>
          <NumberField.Decrement label="Fewer seats" />
          <NumberField.Input />
          <NumberField.Increment label="More seats" />
        </NumberField.Group>
      </NumberField.Root>
    </Field.Root>
  ),
} satisfies Meta<typeof NumberField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Seats' });
    await expect(input).toHaveValue('2');
    await userEvent.click(canvas.getByRole('button', { name: 'More seats' }));
    await expect(input).toHaveValue('3');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      3,
      expect.anything(),
    );
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveValue('2');
  },
};

export const AtTheLimit: Story = {
  args: { defaultValue: 10 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: 'More seats' }),
    ).toBeDisabled();
  },
};

export const Disabled: Story = { args: { disabled: true } };
