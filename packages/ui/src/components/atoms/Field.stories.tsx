import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Checkbox from './Checkbox';
import * as Field from './Field';
import { Input } from './Input';
import * as Switch from './Switch';

const meta = {
  title: 'Components/Atoms/Field',
  component: Field.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'label, describe or flag a form control',
          not: 'a bare `<label>`, a placeholder',
        },
      ],
      purpose:
        'Wraps a form control with its label, description and error, wired together for screen readers.',
      useWhen: [
        'Any Input, Textarea, Select, Slider or Checkbox in a form',
        'A control needs a hint or a validation message',
      ],
      alternatives: [],
      do: [
        'Use Field.Label instead of a bare <label>',
        'Show validation with Field.Error so it is announced',
      ],
      dont: [
        'Use placeholder text in place of a label',
        'Show an error before the person has touched the control',
      ],
    }),
    layout: 'centered',
  },
  args: { validationMode: 'onBlur' },
  render: (args) => (
    <Field.Root className="w-80" {...args}>
      <Field.Label>Work email</Field.Label>
      <Input type="email" required placeholder="name@company.com" />
      <Field.Description>We only use this to send invoices.</Field.Description>
      <Field.Error match="valueMissing">Enter your work email.</Field.Error>
      <Field.Error match="typeMismatch">
        That doesn’t look like an email address.
      </Field.Error>
    </Field.Root>
  ),
} satisfies Meta<typeof Field.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: /work email/i });
    await expect(input).toHaveAccessibleDescription(/send invoices/i);

    await userEvent.type(input, 'not-an-email');
    await userEvent.tab();
    await waitFor(() =>
      expect(canvas.getByText(/doesn’t look like an email/i)).toBeVisible(),
    );
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    await userEvent.clear(input);
    await userEvent.tab();
    await waitFor(() =>
      expect(canvas.getByText(/enter your work email/i)).toBeVisible(),
    );

    await userEvent.click(input);
    await userEvent.type(input, 'ada@example.com');
    await userEvent.tab();
    await waitFor(() =>
      expect(canvas.queryByText(/email address\.$/i)).not.toBeInTheDocument(),
    );
    await expect(input).not.toHaveAttribute('aria-invalid');
  },
};

export const Invalid: Story = {
  args: { invalid: true },
  render: (args) => (
    <Field.Root className="w-80" {...args}>
      <Field.Label>Project name</Field.Label>
      <Input defaultValue="Untitled" />
      <Field.Error match>That name is already taken.</Field.Error>
    </Field.Root>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <Field.Root className="w-80" {...args}>
      <Field.Label>Workspace URL</Field.Label>
      <Input defaultValue="metalab.design" />
      <Field.Description>Contact an admin to change this.</Field.Description>
    </Field.Root>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('textbox', { name: /workspace url/i }),
    ).toBeDisabled();
  },
};

/*
 * A Field labels any Field-aware control, not just text inputs. Checkbox and
 * Switch sit inside the Label so a click anywhere on the row toggles them.
 */
export const WithToggles: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      <Field.Root {...args}>
        <Field.Label>
          <Checkbox.Root>
            <Checkbox.Indicator />
          </Checkbox.Root>
          Email me product updates
        </Field.Label>
        <Field.Description>About one email a month.</Field.Description>
      </Field.Root>
      <Field.Root {...args}>
        <Field.Label>
          <Switch.Root>
            <Switch.Thumb />
          </Switch.Root>
          Compact layout
        </Field.Label>
      </Field.Root>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const checkbox = canvas.getByRole('checkbox', {
      name: /product updates/i,
    });
    await expect(checkbox).toHaveAccessibleDescription(/one email a month/i);
    await userEvent.click(canvas.getByText(/compact layout/i));
    await expect(
      canvas.getByRole('switch', { name: /compact layout/i }),
    ).toBeChecked();
  },
};
