import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor } from 'storybook/test';

import { usage } from '#storybook/usage';
import * as NavigationMenu from './NavigationMenu';

const PRODUCTS = [
  { title: 'Boards', text: 'Plan work in columns you can drag.' },
  { title: 'Docs', text: 'Write specs next to the work.' },
  { title: 'Forms', text: 'Collect requests without email.' },
  { title: 'Reports', text: 'See where time actually goes.' },
];

const meta = {
  title: 'Components/Atoms/NavigationMenu',
  component: NavigationMenu.Root,
  parameters: {
    ...usage({
      choose: [
        {
          need: 'site links with drop-down panels in a top bar',
          not: 'a `Menu` per link',
        },
      ],
      purpose:
        'Site navigation across the top, where items can open a panel of links.',
      useWhen: [
        'A website or store with a handful of sections',
        'Sections with several pages worth describing in a line',
      ],
      alternatives: [
        { use: 'SideNav', when: 'it is an app people work in all day' },
        { use: 'Menu', when: 'the items are actions, not places' },
        { use: 'Menubar', when: 'it is a tool with File and Edit menus' },
      ],
      do: [
        'Give each panel link a title and a short line',
        'Swap it for a Drawer on phones',
      ],
      dont: [
        'Put forms or buttons in the panels',
        'Use more than about seven top-level items',
      ],
    }),
    a11y: { context: 'body' },
  },
  render: () => (
    <NavigationMenu.Root aria-label="Main">
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Product</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul className="tablet:grid-cols-2 grid gap-1">
              {PRODUCTS.map((item) => (
                <li key={item.title}>
                  <NavigationMenu.Link href={`#${item.title.toLowerCase()}`}>
                    <span className="type-body-sm type-strong">
                      {item.title}
                    </span>
                    <span className="type-body-sm text-muted-foreground">
                      {item.text}
                    </span>
                  </NavigationMenu.Link>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <NavigationMenu.Link variant="bar" href="#pricing">
            Pricing
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  ),
} satisfies Meta<typeof NavigationMenu.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Product' }));
    const link = await screen.findByRole('link', { name: /boards/i });
    await waitFor(() => expect(link).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await expect(canvas.getByRole('link', { name: 'Pricing' })).toBeVisible();
  },
};
