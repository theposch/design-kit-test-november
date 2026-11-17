import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId } from 'react';
import { expect, fn } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Checkbox from './Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

const extras = [
  { value: 'backups', label: 'Daily backups', hint: '$4 a month' },
  { value: 'sso', label: 'Single sign-on', hint: '$8 a month' },
  { value: 'audit', label: 'Audit log', hint: '$6 a month' },
];

const meta = {
  title: 'Components/Atoms/CheckboxGroup',
  component: CheckboxGroup,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'tick several options from a short list',
          not: 'loose `Checkbox`es with no group',
        },
      ],
      purpose: 'A short list where people tick any number of options.',
      useWhen: [
        'Add-ons, notification types or features to switch on',
        'Two to about eight options, all visible at once',
      ],
      alternatives: [
        { use: 'Combobox', when: 'the list is long; use multiple' },
        { use: 'Radio', when: 'only one can be chosen' },
        { use: 'Tag', when: 'the options are one or two words' },
      ],
      do: [
        'Name the group with aria-labelledby',
        'Put a short hint under labels that need it',
      ],
      dont: [
        'Use it for a single yes or no; use one Checkbox or Switch',
        'Put actions in the list',
      ],
    }),
  },
  args: { defaultValue: ['backups'], onValueChange: fn() },
  render: function Render(args) {
    const labelId = useId();
    return (
      <div className="flex flex-col gap-3">
        <span id={labelId} className="type-body-sm text-foreground">
          Add-ons
        </span>
        <CheckboxGroup aria-labelledby={labelId} {...args}>
          {extras.map((extra) => (
            <label
              key={extra.value}
              className="type-body-sm text-foreground flex items-start gap-2"
            >
              <Checkbox.Root value={extra.value} className="mt-0.5">
                <Checkbox.Indicator />
              </Checkbox.Root>
              <span className="flex flex-col">
                {extra.label}
                <span className="text-muted-foreground">{extra.hint}</span>
              </span>
            </label>
          ))}
        </CheckboxGroup>
      </div>
    );
  },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('group', { name: 'Add-ons' })).toBeVisible();
    await userEvent.click(
      canvas.getByRole('checkbox', { name: /single sign-on/i }),
    );
    await expect(args.onValueChange).toHaveBeenLastCalledWith(
      ['backups', 'sso'],
      expect.anything(),
    );
  },
};
