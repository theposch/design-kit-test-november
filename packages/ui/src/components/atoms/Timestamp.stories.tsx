import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Timestamp } from './Timestamp';

const NOW = new Date('2026-03-12T15:00:00Z');
const EARLIER = new Date('2026-03-12T12:00:00Z');

const meta = {
  title: 'Components/Atoms/Timestamp',
  component: Timestamp,
  parameters: {
    ...usage({
      choose: [
        { need: 'show a date or time', not: 'a date formatted by hand' },
      ],
      purpose: 'A date or time, written the way the reader expects.',
      useWhen: [
        'When something happened, like an order or a comment',
        'A due date or an event time',
      ],
      alternatives: [{ use: 'Text', when: 'it is a date range or a duration' }],
      do: [
        'Pass the reader’s locale from the app',
        'Use relative for recent activity, date for records',
      ],
      dont: [
        'Format dates by hand into strings',
        'Use relative for dates far in the past',
      ],
    }),
  },
  argTypes: {
    format: {
      control: 'inline-radio',
      options: ['date', 'time', 'datetime', 'relative'],
    },
  },
  args: { date: EARLIER, locale: 'en-US', format: 'date', now: NOW },
} satisfies Meta<typeof Timestamp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const time = canvas.getByText('Mar 12, 2026');
    await expect(time.tagName).toBe('TIME');
    await expect(time).toHaveAttribute('datetime', EARLIER.toISOString());
  },
};

export const Relative: Story = {
  args: { format: 'relative' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('3 hours ago')).toBeVisible();
  },
};

export const OtherLanguage: Story = {
  args: { locale: 'de-DE', format: 'relative' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('vor 3 Stunden')).toBeVisible();
  },
};
