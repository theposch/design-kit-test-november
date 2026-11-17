import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Text } from './Text';

const SAMPLE =
  'Good layouts give every element a clear place, so people find what they need without thinking about it.';

const meta = {
  title: 'Components/Atoms/Text',
  component: Text,
  parameters: {
    ...usage({
      purpose:
        'Body text in one of the type styles, with an optional muted or error tone.',
      useWhen: [
        'Paragraphs, descriptions and supporting lines',
        'Small print such as captions and legal text',
      ],
      alternatives: [
        { use: 'Heading', when: 'it titles a section of the page' },
        { use: 'Field.Error', when: 'it reports a problem with an input' },
      ],
      do: [
        'Use tone="muted" for supporting text under a title',
        'Use render={<span />} for text inside a sentence or a row',
      ],
      dont: [
        'Make text bold or large to fake a heading',
        'Use lines to hide text people need to read',
      ],
    }),
  },
  argTypes: {
    register: {
      control: 'select',
      options: ['body-xs', 'body-sm', 'body-base', 'body-lg', 'label-sm'],
    },
    tone: {
      control: 'inline-radio',
      options: ['inherit', 'muted', 'destructive'],
    },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    lines: { control: 'inline-radio', options: ['all', '1', '2', '3'] },
  },
  args: { children: SAMPLE },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Text {...args} className="max-w-md" />,
  play: async ({ canvas }) => {
    const text = canvas.getByText(SAMPLE);
    await expect(text.tagName).toBe('P');
  },
};

export const Registers: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Text register="body-lg">Body large, for intros</Text>
      <Text register="body-base">Body, for most text</Text>
      <Text register="body-sm" tone="muted">
        Body small and muted, for supporting lines
      </Text>
      <Text register="body-xs" tone="muted">
        Body extra small, for captions and legal text
      </Text>
      <Text register="label-sm">
        Label, for the question over a set of options
      </Text>
    </div>
  ),
};

export const Strong: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Text register="body-lg" strong data-testid="price">
        $24.00
      </Text>
      <Text register="body-sm" tone="muted">
        Free shipping over $50
      </Text>
      <Text register="body-base" strong render={<div />}>
        Total{' '}
        <Text
          register="body-sm"
          tone="muted"
          render={<span />}
          data-testid="note"
        >
          including tax
        </Text>
      </Text>
    </div>
  ),
  play: async ({ canvas }) => {
    const weight = getComputedStyle(canvas.getByTestId('price')).fontWeight;
    await expect(Number(weight)).toBeGreaterThan(400);
    const nested = getComputedStyle(canvas.getByTestId('note')).fontWeight;
    await expect(Number(nested)).toBe(400);
  },
};

export const Truncated: Story = {
  args: { lines: '1' },
  render: (args) => <Text {...args} className="w-64" />,
  play: async ({ canvas }) => {
    const text = canvas.getByText(SAMPLE);
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
  },
};
