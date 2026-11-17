import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as Breadcrumb from './Breadcrumb';

const meta = {
  title: 'Components/Atoms/Breadcrumb',
  component: Breadcrumb.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'show where a page sits in a hierarchy',
          not: 'text with slashes',
        },
      ],
      purpose: 'The trail of pages above this one, so people can step back up.',
      useWhen: [
        'Pages nested two or more levels deep',
        'People arrive from search and need to know where they are',
      ],
      alternatives: [
        { use: 'TextLink', when: 'there is only one level to go back to' },
        { use: 'Tabs', when: 'the pages are siblings, not parents' },
      ],
      do: [
        'End with the current page, not as a link',
        'Use the same names as the navigation',
      ],
      dont: [
        'Use it for the steps of a task; use Stepper',
        'Show it on top-level pages',
      ],
    }),
  },
  args: { label: 'Breadcrumb' },
  render: (args) => (
    <Breadcrumb.Root {...args}>
      <Breadcrumb.List>
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#projects">Projects</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Link href="#mobile">Mobile app</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.Page>Settings</Breadcrumb.Page>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  ),
} satisfies Meta<typeof Breadcrumb.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(nav).toBeVisible();
    await expect(canvas.getAllByRole('link')).toHaveLength(2);
    await expect(canvas.getByText('Settings')).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
};
