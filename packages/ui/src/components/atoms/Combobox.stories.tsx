import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment } from 'react';
import { expect, screen, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Combobox from './Combobox';
import * as Field from './Field';

const cities = [
  'Amsterdam',
  'Berlin',
  'Copenhagen',
  'Dublin',
  'Lisbon',
  'London',
  'Madrid',
  'Paris',
  'Vienna',
];

const meta = {
  title: 'Components/Atoms/Combobox',
  component: Combobox.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'search a long list, pick one or several',
          not: 'a `Select` with 50 options',
        },
      ],
      purpose:
        'Type to narrow a long list, then pick one value, or several shown as chips.',
      useWhen: [
        'More options than fit comfortably in a Select',
        'People know what they want and would rather type it',
      ],
      alternatives: [
        { use: 'Select', when: 'there are fewer than about 15 options' },
        { use: 'Tag', when: 'several options should all be visible' },
        { use: 'Checkbox', when: 'a short list allows several picks' },
      ],
      do: ['Show a message when nothing matches', 'Keep chip labels short'],
      dont: [
        'Use it to run actions; use Menu',
        'Load it with options people cannot tell apart',
      ],
    }),
    a11y: { context: 'body' },
  },
} satisfies Meta<typeof Combobox.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const popup = (
  <Combobox.Portal>
    <Combobox.Positioner>
      <Combobox.Popup>
        <Combobox.Empty>No cities match.</Combobox.Empty>
        <Combobox.List>
          {(city: string) => (
            <Combobox.Item key={city} value={city}>
              <Combobox.ItemIndicator />
              {city}
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Portal>
);

export const Default: Story = {
  render: () => (
    <Combobox.Root items={cities}>
      <Field.Root className="w-72">
        <Field.Label>Office</Field.Label>
        <Combobox.InputGroup>
          <Combobox.Input placeholder="Start typing a city" />
          <Combobox.Clear label="Clear office" />
          <Combobox.Trigger label="Show offices" />
        </Combobox.InputGroup>
      </Field.Root>
      {popup}
    </Combobox.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('combobox', { name: 'Office' });
    await userEvent.type(input, 'lis');
    await userEvent.click(
      await screen.findByRole('option', { name: 'Lisbon' }),
    );
    await waitFor(() => expect(input).toHaveValue('Lisbon'));

    await userEvent.clear(input);
    await userEvent.type(input, 'zzz');
    const empty = await screen.findByText('No cities match.');
    await waitFor(() => expect(empty).toBeVisible());
  },
};

export const Multiple: Story = {
  render: () => (
    <Combobox.Root items={cities} multiple defaultValue={['Berlin']}>
      <Field.Root className="w-80">
        <Field.Label>Offices</Field.Label>
        <Combobox.InputGroup>
          <Combobox.Chips>
            <Combobox.Value>
              {(chosen: string[]) => (
                <Fragment>
                  {chosen.map((city) => (
                    <Combobox.Chip key={city} aria-label={city}>
                      {city}
                      <Combobox.ChipRemove label={`Remove ${city}`} />
                    </Combobox.Chip>
                  ))}
                  <Combobox.Input
                    placeholder={chosen.length > 0 ? '' : 'Add cities'}
                  />
                </Fragment>
              )}
            </Combobox.Value>
          </Combobox.Chips>
        </Combobox.InputGroup>
      </Field.Root>
      {popup}
    </Combobox.Root>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Offices' }),
      'par',
    );
    await userEvent.click(await screen.findByRole('option', { name: 'Paris' }));
    await expect(
      await canvas.findByRole('button', { name: 'Remove Paris' }),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Berlin' }),
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole('button', { name: 'Remove Berlin' }),
      ).not.toBeInTheDocument(),
    );
  },
};
