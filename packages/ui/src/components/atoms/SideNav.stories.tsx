import type { Meta, StoryObj } from '@storybook/react-vite';
import { FolderKanban, Home, Inbox, Settings, Users } from 'lucide-react';
import { expect } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as SideNav from './SideNav';

const meta = {
  title: 'Components/Atoms/SideNav',
  component: SideNav.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'move between the main areas of an app',
          not: 'a list of `TextLink`s',
        },
      ],
      purpose:
        'A column of links to the main places in an app, in named groups.',
      useWhen: [
        'An app with five or more top-level places',
        'Places people move between all day, like Inbox and Projects',
      ],
      alternatives: [
        { use: 'NavigationMenu', when: 'it is a website with a few sections' },
        { use: 'Tabs', when: 'switching views inside one page' },
      ],
      do: [
        'Mark the page you are on with current',
        'Put it in a Drawer on phones',
      ],
      dont: [
        'Put actions like "Delete" in it; it is for going places',
        'Nest more than one level of groups',
      ],
    }),
  },
  args: { label: 'Main' },
  render: (args) => (
    <SideNav.Root {...args} className="w-60">
      <SideNav.Group>
        <SideNav.List>
          <SideNav.Item>
            <SideNav.Link href="#home">
              <Home aria-hidden />
              Home
            </SideNav.Link>
          </SideNav.Item>
          <SideNav.Item>
            <SideNav.Link href="#inbox" current>
              <Inbox aria-hidden />
              Inbox
              <SideNav.LinkEnd>12</SideNav.LinkEnd>
            </SideNav.Link>
          </SideNav.Item>
        </SideNav.List>
      </SideNav.Group>
      <SideNav.Group>
        <SideNav.GroupLabel>Workspace</SideNav.GroupLabel>
        <SideNav.List>
          <SideNav.Item>
            <SideNav.Link href="#projects">
              <FolderKanban aria-hidden />
              Projects
            </SideNav.Link>
          </SideNav.Item>
          <SideNav.Item>
            <SideNav.Link href="#people">
              <Users aria-hidden />
              People
            </SideNav.Link>
          </SideNav.Item>
          <SideNav.Item>
            <SideNav.Link href="#settings">
              <Settings aria-hidden />
              Settings
            </SideNav.Link>
          </SideNav.Item>
        </SideNav.List>
      </SideNav.Group>
    </SideNav.Root>
  ),
} satisfies Meta<typeof SideNav.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('navigation', { name: 'Main' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: /inbox/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(
      canvas.getByRole('heading', { name: 'Workspace' }),
    ).toBeVisible();
  },
};
