import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from 'react';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Radio from './Radio';
import { RadioGroup } from './RadioGroup';

const plans = [
  { value: 'starter', label: 'Starter' },
  { value: 'team', label: 'Team' },
  { value: 'enterprise', label: 'Enterprise', disabled: true },
];

/*
 * Radio and RadioGroup are separate atoms, mirroring Base UI's two modules,
 * so they share one story: a Radio is meaningless outside its group.
 */
const meta = {
  title: 'Components/Atoms/Radio',
  component: RadioGroup,
  parameters: {
    ...usage({
      purpose:
        'Picks exactly one option from a short list that is all visible at once.',
      useWhen: [
        'Two to about six options people should compare',
        'Choices like plans or delivery speeds, where seeing them all helps',
      ],
      alternatives: [
        { use: 'Select', when: 'there are many options or space is tight' },
        { use: 'Checkbox', when: 'several options can be chosen' },
        { use: 'ToggleGroup', when: 'a compact single choice in a toolbar' },
      ],
      do: [
        'Label the group (aria-labelledby, or a Field label)',
        'Pre-select a sensible default',
      ],
      dont: ['Use a single radio on its own', 'Use radios to trigger actions'],
    }),
    layout: 'centered',
  },
  args: { defaultValue: 'starter', onValueChange: fn() },
  render: function Render(args) {
    const labelId = useId();
    return (
      <div className="flex flex-col gap-3">
        <div id={labelId} className="type-body-sm text-foreground">
          Plan
        </div>
        <RadioGroup aria-labelledby={labelId} {...args}>
          {plans.map(({ value, label, disabled }) => (
            <label
              key={value}
              className="type-body-sm text-foreground flex items-center gap-2"
            >
              <Radio.Root value={value} disabled={disabled}>
                <Radio.Indicator />
              </Radio.Root>
              {label}
            </label>
          ))}
        </RadioGroup>
      </div>
    );
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole('radiogroup', { name: /plan/i }),
    ).toBeVisible();
    const starter = canvas.getByRole('radio', { name: /starter/i });
    const team = canvas.getByRole('radio', { name: /team/i });
    await expect(starter).toBeChecked();

    await userEvent.click(canvas.getByText(/^team$/i));
    await expect(team).toBeChecked();
    await expect(starter).not.toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      'team',
      expect.anything(),
    );

    await userEvent.keyboard('{ArrowUp}');
    await expect(starter).toBeChecked();
    await expect(starter).toHaveFocus();

    await expect(
      canvas.getByRole('radio', { name: /enterprise/i }),
    ).toHaveAttribute('aria-disabled', 'true');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
