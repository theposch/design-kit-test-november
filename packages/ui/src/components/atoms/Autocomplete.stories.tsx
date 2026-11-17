import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Autocomplete from './Autocomplete';
import * as Field from './Field';

const TOPICS = [
  'Accessibility',
  'Breakpoints',
  'Colour tokens',
  'Dark mode',
  'Design tokens',
  'Focus rings',
  'Motion',
  'Spacing',
  'Typography',
];

const meta = {
  title: 'Components/Atoms/Autocomplete',
  component: Autocomplete.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'a text box that suggests matches as you type',
          not: '`Combobox` (that one picks a value)',
        },
      ],
      purpose:
        'A search box that suggests matches as you type, but accepts any text.',
      useWhen: [
        'Searching docs, help or products',
        'A command palette, with the list shown inline',
      ],
      alternatives: [
        { use: 'Combobox', when: 'the value must be one of the options' },
        { use: 'Input', when: 'there is nothing useful to suggest' },
      ],
      do: [
        'Label the box, even if the label is visually hidden',
        'Show a message when nothing matches',
      ],
      dont: [
        'Use it to pick a required value from a fixed list',
        'Suggest more than about ten items at once',
      ],
    }),
    a11y: { context: 'body' },
  },
  render: () => (
    <Autocomplete.Root items={TOPICS}>
      <Field.Root className="w-72">
        <Field.Label>Search the guide</Field.Label>
        <Autocomplete.InputGroup>
          <Search aria-hidden className="text-muted-foreground" />
          <Autocomplete.Input placeholder="Try “tokens”" />
        </Autocomplete.InputGroup>
      </Field.Root>
      <Autocomplete.Portal>
        <Autocomplete.Positioner>
          <Autocomplete.Popup>
            <Autocomplete.Empty>No topics match.</Autocomplete.Empty>
            <Autocomplete.List>
              {(topic: string) => (
                <Autocomplete.Item key={topic} value={topic}>
                  {topic}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  ),
} satisfies Meta<typeof Autocomplete.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Search the guide' });
    await userEvent.type(input, 'tok');
    const option = await screen.findByRole('option', { name: 'Colour tokens' });
    /* The popup fades in, so the option exists a moment before it is visible. */
    await waitFor(() => expect(option).toBeVisible());
    await userEvent.click(
      screen.getByRole('option', { name: 'Design tokens' }),
    );
    await waitFor(() => expect(input).toHaveValue('Design tokens'));
  },
};
