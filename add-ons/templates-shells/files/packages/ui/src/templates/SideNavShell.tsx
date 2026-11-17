import {
  BarChart3,
  FolderKanban,
  Home,
  Inbox,
  Menu,
  PanelLeft,
  Plus,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import * as Avatar from '#components/atoms/Avatar';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Drawer from '#components/atoms/Drawer';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Kbd } from '#components/atoms/Kbd';
import { Layout } from '#components/atoms/Layout';
import * as List from '#components/atoms/List';
import * as SideNav from '#components/atoms/SideNav';
import { Stack } from '#components/atoms/Stack';
import { StatusDot } from '#components/atoms/StatusDot';
import { Text } from '#components/atoms/Text';
import {
  CommandPalette,
  type CommandGroup,
} from '#components/molecules/CommandPalette';
import { IconButton } from '#components/molecules/IconButton';
import { useShortcut } from './parts/useShortcut';
import { useWideScreen } from './parts/useWideScreen';

const PLACES = [
  { href: '#home', label: 'Home', icon: Home, current: true },
  { href: '#inbox', label: 'Inbox', icon: Inbox, count: 4 },
  { href: '#projects', label: 'Projects', icon: FolderKanban },
  { href: '#reports', label: 'Reports', icon: BarChart3 },
];

const TEAM = [
  { href: '#people', label: 'People', icon: Users },
  { href: '#settings', label: 'Settings', icon: Settings },
];

const RECENT = ['Spring launch plan', 'Pricing page copy', 'Hiring tracker'];

const COMMANDS: CommandGroup[] = [
  {
    label: 'Go to',
    items: [...PLACES, ...TEAM].map((place) => ({
      value: place.href,
      label: place.label,
      icon: place.icon,
    })),
  },
  {
    label: 'Create',
    items: [{ value: 'new', label: 'New project', icon: Plus, shortcut: '⌘N' }],
  },
];

const STATS = [
  { label: 'Open tasks', value: '18', note: '5 due this week' },
  { label: 'In review', value: '6', note: '2 waiting on you' },
  { label: 'Shipped this month', value: '24', note: '8 more than last month' },
];

const ACTIVITY = [
  {
    who: 'Kai Lindqvist',
    initials: 'KL',
    text: 'moved “Pricing page copy” to review',
  },
  {
    who: 'Sam Okafor',
    initials: 'SO',
    text: 'commented on “Spring launch plan”',
  },
  { who: 'Ada Moreno', initials: 'AM', text: 'created “Hiring tracker”' },
];

/* The app's navigation, shared by the side panel and the phone drawer. */
function Navigation({ onSearch }: { onSearch: () => void }) {
  return (
    <Stack gap={6}>
      <Stack direction="row" align="center" gap={2}>
        <Avatar.Root className="size-8 rounded-md">
          <Avatar.Fallback className="type-body-xs">NW</Avatar.Fallback>
        </Avatar.Root>
        <Text strong render={<span />}>
          Northwind
        </Text>
      </Stack>
      <Button
        variant="outline"
        className="justify-start gap-2"
        onClick={onSearch}
      >
        <Icon icon={Search} />
        <span className="flex-1 text-start">Search</span>
        <Kbd>⌘K</Kbd>
      </Button>
      <SideNav.Root label="Main">
        <SideNav.Group>
          <SideNav.List>
            {PLACES.map((place) => (
              <SideNav.Item key={place.href}>
                <SideNav.Link href={place.href} current={place.current}>
                  <place.icon aria-hidden />
                  {place.label}
                  {place.count && (
                    <SideNav.LinkEnd>
                      {place.count}
                      <span className="sr-only"> unread</span>
                    </SideNav.LinkEnd>
                  )}
                </SideNav.Link>
              </SideNav.Item>
            ))}
          </SideNav.List>
        </SideNav.Group>
        <SideNav.Group>
          <SideNav.GroupLabel>Recent</SideNav.GroupLabel>
          <SideNav.List>
            {RECENT.map((item) => (
              <SideNav.Item key={item}>
                <SideNav.Link href="#recent">
                  <StatusDot tone="info" />
                  <span className="truncate">{item}</span>
                </SideNav.Link>
              </SideNav.Item>
            ))}
          </SideNav.List>
        </SideNav.Group>
        <SideNav.Group>
          <SideNav.GroupLabel>Team</SideNav.GroupLabel>
          <SideNav.List>
            {TEAM.map((place) => (
              <SideNav.Item key={place.href}>
                <SideNav.Link href={place.href}>
                  <place.icon aria-hidden />
                  {place.label}
                </SideNav.Link>
              </SideNav.Item>
            ))}
          </SideNav.List>
        </SideNav.Group>
      </SideNav.Root>
    </Stack>
  );
}

/*
 * An app frame with one column of navigation down the side. It can be hidden
 * on desktop, and moves into a slide-out drawer on tablets and phones.
 */
export function SideNavShell() {
  const wide = useWideScreen();
  const [sidebar, setSidebar] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const openSearch = useCallback(() => {
    setDrawer(false);
    setSearch(true);
  }, []);
  useShortcut('k', openSearch);

  return (
    <>
      <Layout
        height="screen"
        start={
          wide && sidebar
            ? {
                label: 'Sidebar',
                content: <Navigation onSearch={openSearch} />,
              }
            : undefined
        }
        header={
          wide ? undefined : (
            <Stack direction="row" align="center" justify="between" gap={4}>
              <IconButton
                icon={Menu}
                label="Open menu"
                onClick={() => setDrawer(true)}
              />
              <Text strong render={<span />}>
                Northwind
              </Text>
              <IconButton icon={Search} label="Search" onClick={openSearch} />
            </Stack>
          )
        }
      >
        <Stack gap={8}>
          <Stack direction="row" align="center" justify="between" gap={4} wrap>
            <Stack direction="row" align="center" gap={2}>
              {wide && (
                <IconButton
                  icon={PanelLeft}
                  label={sidebar ? 'Hide sidebar' : 'Show sidebar'}
                  aria-pressed={sidebar}
                  onClick={() => setSidebar(!sidebar)}
                />
              )}
              <Heading level={1} register="heading-2">
                Good morning, Ada
              </Heading>
            </Stack>
            <Button>
              <Plus aria-hidden />
              New project
            </Button>
          </Stack>
          <Grid columns={{ minWidth: 200, max: 3 }} gap={4}>
            {STATS.map((stat) => (
              <Card.Root key={stat.label}>
                <Card.Body className="gap-1">
                  <Text register="body-sm" tone="muted">
                    {stat.label}
                  </Text>
                  <Text register="body-lg" strong>
                    {stat.value}
                  </Text>
                  <Text register="body-xs" tone="muted">
                    {stat.note}
                  </Text>
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
          <Stack gap={4}>
            <Heading level={2} register="heading-4">
              Latest activity
            </Heading>
            <List.Root>
              {ACTIVITY.map((entry) => (
                <List.Item key={entry.text}>
                  <Avatar.Root className="size-8">
                    <Avatar.Fallback className="type-body-xs">
                      {entry.initials}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <List.Content>
                    <List.Title>{entry.who}</List.Title>
                    <List.Description>{entry.text}</List.Description>
                  </List.Content>
                </List.Item>
              ))}
            </List.Root>
          </Stack>
        </Stack>
      </Layout>

      <Drawer.Root
        open={!wide && drawer}
        onOpenChange={setDrawer}
        swipeDirection="left"
      >
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Viewport>
            <Drawer.Popup aria-label="Menu">
              <Navigation onSearch={openSearch} />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <CommandPalette
        open={search}
        onOpenChange={setSearch}
        label="Search"
        placeholder="Search or jump to…"
        emptyText="Nothing matches."
        hints={[
          { key: 'Enter', label: 'to open' },
          { key: 'Esc', label: 'to close' },
        ]}
        groups={COMMANDS}
        onSelect={() => undefined}
      />
    </>
  );
}
