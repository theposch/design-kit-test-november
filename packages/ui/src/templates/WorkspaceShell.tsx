import { FileText, Folder, Menu as MenuIcon, Search } from 'lucide-react';
import { useCallback, useState, type MouseEvent } from 'react';

import * as Breadcrumb from '#components/atoms/Breadcrumb';
import { Button } from '#components/atoms/Button';
import * as Collapsible from '#components/atoms/Collapsible';
import * as Drawer from '#components/atoms/Drawer';
import { Heading } from '#components/atoms/Heading';
import { Kbd } from '#components/atoms/Kbd';
import { Layout } from '#components/atoms/Layout';
import * as Menu from '#components/atoms/Menu';
import * as Menubar from '#components/atoms/Menubar';
import * as SideNav from '#components/atoms/SideNav';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import {
  CommandPalette,
  type CommandGroup,
} from '#components/molecules/CommandPalette';
import { IconButton } from '#components/molecules/IconButton';
import { useShortcut } from './parts/useShortcut';
import { useWideScreen } from './parts/useWideScreen';

type Doc = { name: string; folder: string; text: string[] };

const DOCS: Doc[] = [
  {
    name: 'Brief',
    folder: 'Spring launch',
    text: [
      'We launch the Harbour collection on 14 March, online first and in stores a week later.',
      'The goal is 2,000 orders in the first month, half of them from people new to us.',
    ],
  },
  {
    name: 'Timeline',
    folder: 'Spring launch',
    text: ['Photography wraps on 20 February. Copy is final on 1 March.'],
  },
  {
    name: 'Press list',
    folder: 'Spring launch',
    text: ['Twelve titles, with samples going out on 3 March.'],
  },
  {
    name: 'Voice and tone',
    folder: 'Brand',
    text: ['Warm, plain and brief. We write like a good shop assistant talks.'],
  },
  {
    name: 'Colours',
    folder: 'Brand',
    text: [
      'Sea blue leads; sand and moss support it. Never more than three at once.',
    ],
  },
];

const FOLDERS = [...new Set(DOCS.map((doc) => doc.folder))];

const MENUS = [
  {
    label: 'File',
    items: [
      ['New document', '⌘N'],
      ['Duplicate', '⌘D'],
      ['Export…', '⇧⌘E'],
    ],
  },
  {
    label: 'Edit',
    items: [
      ['Undo', '⌘Z'],
      ['Redo', '⇧⌘Z'],
      ['Find', '⌘F'],
    ],
  },
  {
    label: 'View',
    items: [
      ['Show sidebar', '⌘B'],
      ['Full width', ''],
    ],
  },
];

const COMMANDS: CommandGroup[] = [
  {
    label: 'Documents',
    items: DOCS.map((doc) => ({
      value: doc.name,
      label: doc.name,
      icon: FileText,
    })),
  },
];

/* Folders that fold open, with their documents; the open one is marked current. */
function FileTree({
  open,
  onOpen,
}: {
  open: string;
  onOpen: (name: string) => void;
}) {
  return (
    <SideNav.Root label="Documents">
      {FOLDERS.map((folder) => (
        <Collapsible.Root key={folder} defaultOpen>
          <SideNav.Link render={<Collapsible.Trigger />}>
            <Folder aria-hidden />
            <span className="flex-1 text-start">{folder}</span>
          </SideNav.Link>
          <Collapsible.Panel>
            <SideNav.List className="ps-4">
              {DOCS.filter((doc) => doc.folder === folder).map((doc) => (
                <SideNav.Item key={doc.name}>
                  <SideNav.Link
                    href={`#${doc.name.toLowerCase().replace(/\W+/g, '-')}`}
                    current={doc.name === open}
                    onClick={(event: MouseEvent) => {
                      event.preventDefault();
                      onOpen(doc.name);
                    }}
                  >
                    <FileText aria-hidden />
                    {doc.name}
                  </SideNav.Link>
                </SideNav.Item>
              ))}
            </SideNav.List>
          </Collapsible.Panel>
        </Collapsible.Root>
      ))}
    </SideNav.Root>
  );
}

/*
 * A tool frame with navigation on both axes: menus and search across the
 * top, a folder tree down the side. On tablets and phones the menus hide
 * and the tree moves into a drawer.
 */
export function WorkspaceShell() {
  const wide = useWideScreen();
  const [open, setOpen] = useState('Brief');
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const openSearch = useCallback(() => setSearch(true), []);
  useShortcut('k', openSearch);
  const doc = DOCS.find((item) => item.name === open) ?? DOCS[0];

  function openDoc(name: string) {
    setOpen(name);
    setDrawer(false);
  }

  return (
    <>
      <Layout
        height="screen"
        width="narrow"
        header={
          <Stack direction="row" align="center" justify="between" gap={4}>
            <Stack direction="row" align="center" gap={4}>
              {!wide && (
                <IconButton
                  icon={MenuIcon}
                  label="Show documents"
                  onClick={() => setDrawer(true)}
                />
              )}
              <Text strong render={<span />}>
                Notebook
              </Text>
              {wide && (
                <Menubar.Root aria-label="Application">
                  {MENUS.map((menu) => (
                    <Menu.Root key={menu.label}>
                      <Menubar.Trigger>{menu.label}</Menubar.Trigger>
                      <Menu.Portal>
                        <Menu.Positioner>
                          <Menu.Popup>
                            {menu.items.map(([label, shortcut]) => (
                              <Menu.Item key={label}>
                                <span className="flex-1">{label}</span>
                                {shortcut && <Kbd>{shortcut}</Kbd>}
                              </Menu.Item>
                            ))}
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  ))}
                </Menubar.Root>
              )}
            </Stack>
            {wide ? (
              <Button
                variant="outline"
                className="w-64 justify-start"
                onClick={openSearch}
              >
                <Search aria-hidden />
                <span className="flex-1 text-start">Search documents</span>
                <Kbd>⌘K</Kbd>
              </Button>
            ) : (
              <IconButton
                icon={Search}
                label="Search documents"
                onClick={openSearch}
              />
            )}
          </Stack>
        }
        start={
          wide
            ? {
                label: 'Documents',
                content: <FileTree open={open} onOpen={openDoc} />,
              }
            : undefined
        }
      >
        {doc && (
          <Stack gap={6} render={<article />}>
            <Breadcrumb.Root label="Breadcrumb">
              <Breadcrumb.List>
                <Breadcrumb.Item>
                  <Breadcrumb.Link href="#all">All documents</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
                <Breadcrumb.Item>
                  <Breadcrumb.Link href="#folder">{doc.folder}</Breadcrumb.Link>
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
                <Breadcrumb.Item>
                  <Breadcrumb.Page>{doc.name}</Breadcrumb.Page>
                </Breadcrumb.Item>
              </Breadcrumb.List>
            </Breadcrumb.Root>
            <Heading level={1}>{doc.name}</Heading>
            {doc.text.map((paragraph) => (
              <Text key={paragraph} register="body-lg">
                {paragraph}
              </Text>
            ))}
          </Stack>
        )}
      </Layout>

      <Drawer.Root
        open={!wide && drawer}
        onOpenChange={setDrawer}
        swipeDirection="left"
      >
        <Drawer.Portal>
          <Drawer.Backdrop />
          <Drawer.Viewport>
            <Drawer.Popup aria-label="Documents">
              <FileTree open={open} onOpen={openDoc} />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>

      <CommandPalette
        open={search}
        onOpenChange={setSearch}
        label="Search documents"
        placeholder="Type a document name…"
        emptyText="No documents match."
        hints={[
          { key: 'Enter', label: 'to open' },
          { key: 'Esc', label: 'to close' },
        ]}
        groups={COMMANDS}
        onSelect={(command) => openDoc(command.value)}
      />
    </>
  );
}
