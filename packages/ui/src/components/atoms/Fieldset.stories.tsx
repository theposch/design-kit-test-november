import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Field from './Field';
import * as Fieldset from './Fieldset';
import { Input } from './Input';

const meta = {
  title: 'Components/Atoms/Fieldset',
  component: Fieldset.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'name a group of fields (an address)',
          not: 'a heading over loose fields',
        },
      ],
      purpose: 'A titled group of related fields, like an address.',
      useWhen: [
        'A long form split into named parts',
        'Fields that only make sense together',
      ],
      alternatives: [
        { use: 'Field', when: 'it is a single input with its label' },
        { use: 'Card', when: 'the group also needs a visible frame' },
      ],
      do: [
        'Keep the legend short: "Shipping address"',
        'Disable the whole group with one prop when it does not apply',
      ],
      dont: [
        'Nest fieldsets more than one level deep',
        'Use a legend as a page heading',
      ],
    }),
  },
  render: (args) => (
    <Fieldset.Root {...args} className="w-80">
      <Fieldset.Legend>Shipping address</Fieldset.Legend>
      <Field.Root>
        <Field.Label>Street</Field.Label>
        <Input autoComplete="street-address" />
      </Field.Root>
      <Field.Root>
        <Field.Label>City</Field.Label>
        <Input autoComplete="address-level2" />
      </Field.Root>
    </Fieldset.Root>
  ),
} satisfies Meta<typeof Fieldset.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('group', { name: 'Shipping address' }),
    ).toBeVisible();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText('City')).toBeDisabled();
  },
};
