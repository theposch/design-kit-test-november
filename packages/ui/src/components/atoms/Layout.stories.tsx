import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import { Heading } from './Heading';
import { Layout } from './Layout';
import { Text } from './Text';

const meta = {
  title: 'Components/Atoms/Layout',
  component: Layout,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'frame a whole page',
          use: '`Layout` (or start from a template)',
          not: 'a hand-built header/aside/main',
        },
      ],
      purpose:
        'The page frame: an optional header, side panels and footer around the main content.',
      useWhen: [
        'The outermost element of every page',
        'Pages with a filter or detail panel beside the content',
      ],
      alternatives: [
        { use: 'Stack', when: 'arranging things inside the page' },
        { use: 'Center', when: 'a single centred form, like sign-in' },
      ],
      do: [
        'Pick width for the content: narrow for reading, wide for tables',
        'Use height="screen" when panels should scroll on their own',
      ],
      dont: [
        'Nest one Layout inside another',
        'Add page padding yourself; the frame already has it',
      ],
    }),
    layout: 'fullscreen',
  },
  argTypes: {
    height: { control: 'inline-radio', options: ['auto', 'screen'] },
    width: {
      control: 'inline-radio',
      options: ['narrow', 'default', 'wide', 'full'],
    },
  },
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof meta>;

const Placeholder = ({ label }: { label: string }) => (
  <div className="border-border text-muted-foreground type-body-sm rounded-md border border-dashed p-4">
    {label}
  </div>
);

export const ContentOnly: Story = {
  render: (args) => (
    <Layout {...args}>
      <Heading level={1}>Page title</Heading>
      <Text tone="muted">
        The content area centres and stops growing at its width.
      </Text>
    </Layout>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('main')).toBeVisible();
  },
};

export const AllAreas: Story = {
  render: (args) => (
    <Layout
      {...args}
      header={<Placeholder label="Header" />}
      start={{ label: 'Filters', content: <Placeholder label="Start panel" /> }}
      end={{ label: 'Details', content: <Placeholder label="End panel" /> }}
      footer={<Placeholder label="Footer" />}
    >
      <Placeholder label="Content" />
    </Layout>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('banner')).toBeVisible();
    await expect(
      canvas.getByRole('complementary', { name: 'Filters' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('complementary', { name: 'Details' }),
    ).toBeVisible();
    await expect(canvas.getByRole('contentinfo')).toBeVisible();
  },
};
