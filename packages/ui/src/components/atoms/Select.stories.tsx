import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Field from './Field';
import { Input } from './Input';
import * as Select from './Select';

const roles = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'commenter', label: 'Commenter' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner', disabled: true },
];

const onValueChange = fn();

const meta = {
  title: 'Components/Atoms/Select',
  component: Select.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'pick one value from a list',
          use: '`Select` (many) / `RadioGroup` (≤ ~6)',
          not: '`Menu`',
        },
      ],
      purpose: 'Picks one value from a list that opens in a popup.',
      useWhen: [
        'More options than fit comfortably as radios',
        'Space is tight, such as a table row or toolbar',
      ],
      alternatives: [
        {
          use: 'Radio',
          when: 'there are only a few options and comparing them helps',
        },
        { use: 'Menu', when: 'the items are actions, not values' },
      ],
      do: [
        'Label it with Field.Label',
        'Order options the way people expect: alphabetical, or by size',
      ],
      dont: [
        'Use it for two options; a Switch or Radio is clearer',
        "Hide the page's most important choice inside it",
      ],
    }),

    layout: 'centered',
    /*
     * The popup portals to <body>, outside the story root the a11y addon
     * scans by default; widening the context puts the open listbox's
     * contrast and roles under test.
     */
    a11y: { context: 'body' },
  },
  render: (args) => (
    <div className="flex w-64 flex-col gap-1.5">
      <Select.Root items={roles} onValueChange={onValueChange} {...args}>
        <Select.Label>Role</Select.Label>
        <Select.Trigger>
          <Select.Value placeholder="Choose a role" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.ScrollUpArrow />
              <Select.List>
                {roles.map(({ value, label, disabled }) => (
                  <Select.Item key={value} value={value} disabled={disabled}>
                    <Select.ItemIndicator />
                    <Select.ItemText>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  ),
} satisfies Meta<typeof Select.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    onValueChange.mockClear();
    const trigger = canvas.getByRole('combobox', { name: /role/i });
    await expect(trigger).toHaveTextContent(/choose a role/i);

    await userEvent.click(trigger);
    const listbox = await screen.findByRole('listbox');
    await waitFor(() => expect(listbox).toBeVisible());
    await expect(
      screen.getByRole('option', { name: /owner/i }),
    ).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(screen.getByRole('option', { name: /editor/i }));
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
    await expect(trigger).toHaveTextContent(/editor/i);
    await expect(onValueChange).toHaveBeenLastCalledWith(
      'editor',
      expect.anything(),
    );
  },
};

export const Keyboard: Story = {
  args: { defaultValue: 'viewer' },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: /role/i });
    trigger.focus();

    await userEvent.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /viewer/i })).toHaveFocus(),
    );
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() =>
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
    );
    await expect(trigger).toHaveTextContent(/commenter/i);
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const Open: Story = {
  args: { defaultOpen: true, defaultValue: 'editor' },
};

/*
 * Inside a Field, the select picks up the field's label and description, and
 * its trigger lines up with an Input at the same size rung.
 */
export const InAForm: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      <Field.Root>
        <Field.Label>Email</Field.Label>
        <Input type="email" placeholder="name@company.com" />
      </Field.Root>
      <Field.Root>
        <Field.Label>Role</Field.Label>
        <Select.Root items={roles} {...args}>
          <Select.Trigger>
            <Select.Value placeholder="Choose a role" />
            <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner>
              <Select.Popup>
                <Select.List>
                  {roles.map(({ value, label, disabled }) => (
                    <Select.Item key={value} value={value} disabled={disabled}>
                      <Select.ItemIndicator />
                      <Select.ItemText>{label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
        <Field.Description>Admins can invite people.</Field.Description>
      </Field.Root>
    </div>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: /role/i });
    await expect(trigger).toHaveAccessibleDescription(/invite people/i);
  },
};

export const Invalid: Story = {
  render: (args) => (
    <Field.Root invalid className="w-80">
      <Field.Label>Role</Field.Label>
      <Select.Root items={roles} {...args}>
        <Select.Trigger>
          <Select.Value placeholder="Choose a role" />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {roles.map(({ value, label, disabled }) => (
                  <Select.Item key={value} value={value} disabled={disabled}>
                    <Select.ItemIndicator />
                    <Select.ItemText>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Field.Error match>Choose a role to send the invite.</Field.Error>
    </Field.Root>
  ),
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: /role/i });
    await expect(trigger).toHaveAttribute('data-invalid');
    await expect(canvas.getByText(/choose a role to send/i)).toBeVisible();
  },
};
