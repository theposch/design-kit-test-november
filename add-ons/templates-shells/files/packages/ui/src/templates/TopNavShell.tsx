import { Menu, Search, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

import * as Accordion from '#components/atoms/Accordion';
import { AspectRatio } from '#components/atoms/AspectRatio';
import { Badge } from '#components/atoms/Badge';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Drawer from '#components/atoms/Drawer';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Layout } from '#components/atoms/Layout';
import * as NavigationMenu from '#components/atoms/NavigationMenu';
import * as SideNav from '#components/atoms/SideNav';
import { Stack } from '#components/atoms/Stack';
import { Text } from '#components/atoms/Text';
import { TextLink } from '#components/atoms/TextLink';
import { IconButton } from '#components/molecules/IconButton';
import { DemoImage } from './parts/DemoImage';
import { useWideScreen } from './parts/useWideScreen';

const SECTIONS = [
  {
    label: 'Shop',
    links: [
      { title: 'New in', text: 'This week’s arrivals.' },
      { title: 'Kitchen', text: 'Mugs, boards and carafes.' },
      { title: 'Living', text: 'Throws, cushions and lamps.' },
      { title: 'Outdoor', text: 'Jackets and picnic gear.' },
    ],
  },
  {
    label: 'Collections',
    links: [
      { title: 'Harbour', text: 'Sea-washed blues and greys.' },
      { title: 'Orchard', text: 'Warm wood and linen.' },
      { title: 'Studio', text: 'Made in small batches.' },
    ],
  },
];

const PRODUCTS = [
  { name: 'Stoneware mug', price: '$28' },
  { name: 'Oak serving board', price: '$64' },
  { name: 'Linen napkins', price: '$22' },
  { name: 'Wool throw', price: '$95' },
];

const href = (title: string) => `#${title.toLowerCase().replace(/\W+/g, '-')}`;

/*
 * A site frame with navigation across the top only. Sections open wide
 * panels of links on desktop; on tablets and phones they fold into a drawer.
 */
export function TopNavShell() {
  const wide = useWideScreen();
  const [drawer, setDrawer] = useState(false);

  return (
    <>
      <Layout
        width="wide"
        header={
          <Stack direction="row" align="center" justify="between" gap={4}>
            <Stack direction="row" align="center" gap={6}>
              {!wide && (
                <IconButton
                  icon={Menu}
                  label="Open menu"
                  onClick={() => setDrawer(true)}
                />
              )}
              <Text strong render={<a href="#home" />}>
                Harbour &amp; Co.
              </Text>
              {wide && (
                <NavigationMenu.Root aria-label="Main">
                  <NavigationMenu.List>
                    {SECTIONS.map((section) => (
                      <NavigationMenu.Item key={section.label}>
                        <NavigationMenu.Trigger>
                          {section.label}
                        </NavigationMenu.Trigger>
                        <NavigationMenu.Content>
                          <ul className="tablet:grid-cols-2 grid gap-1">
                            {section.links.map((link) => (
                              <li key={link.title}>
                                <NavigationMenu.Link href={href(link.title)}>
                                  <span className="type-body-sm type-strong">
                                    {link.title}
                                  </span>
                                  <span className="type-body-sm text-muted-foreground">
                                    {link.text}
                                  </span>
                                </NavigationMenu.Link>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenu.Content>
                      </NavigationMenu.Item>
                    ))}
                    <NavigationMenu.Item>
                      <NavigationMenu.Link variant="bar" href="#journal">
                        Journal
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
              )}
            </Stack>
            <Stack direction="row" gap={1}>
              <IconButton icon={Search} label="Search" />
              <IconButton icon={ShoppingBag} label="Bag, 2 items" />
            </Stack>
          </Stack>
        }
      >
        <Stack gap={12}>
          <Card.Root variant="muted">
            <Grid columns={{ minWidth: 320, max: 2 }} gap={0} align="center">
              <Stack gap={4} className="desktop:p-12 p-8">
                <Badge variant="info">New collection</Badge>
                <Heading level={1}>Made for long weekends by the sea</Heading>
                <Text tone="muted">
                  Harbour brings sea-washed colours to the things you use every
                  day.
                </Text>
                <Button size="lg" className="self-start">
                  Shop the collection
                </Button>
              </Stack>
              <AspectRatio ratio="4/3">
                <DemoImage alt="A table set with blue stoneware by a window" />
              </AspectRatio>
            </Grid>
          </Card.Root>
          <Stack gap={6}>
            <Stack direction="row" align="baseline" justify="between" gap={4}>
              <Heading level={2} register="heading-3">
                Best sellers
              </Heading>
              <TextLink href="#shop">See all</TextLink>
            </Stack>
            <Grid columns={{ minWidth: 160, max: 4 }} gap={6}>
              {PRODUCTS.map((product, index) => (
                <Stack key={product.name} gap={2}>
                  <Card.Root variant="muted">
                    <AspectRatio ratio="1/1">
                      <DemoImage alt={product.name} shade={index} />
                    </AspectRatio>
                  </Card.Root>
                  <Text register="body-sm">{product.name}</Text>
                  <Text register="body-sm" strong>
                    {product.price}
                  </Text>
                </Stack>
              ))}
            </Grid>
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
              <SideNav.Root label="Main">
                <Accordion.Root>
                  {SECTIONS.map((section) => (
                    <Accordion.Item key={section.label} value={section.label}>
                      <Accordion.Header render={<h2 />}>
                        <Accordion.Trigger>{section.label}</Accordion.Trigger>
                      </Accordion.Header>
                      <Accordion.Panel>
                        <SideNav.List>
                          {section.links.map((link) => (
                            <SideNav.Item key={link.title}>
                              <SideNav.Link href={href(link.title)}>
                                {link.title}
                              </SideNav.Link>
                            </SideNav.Item>
                          ))}
                        </SideNav.List>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
                <SideNav.List>
                  <SideNav.Item>
                    <SideNav.Link href="#journal">Journal</SideNav.Link>
                  </SideNav.Item>
                </SideNav.List>
              </SideNav.Root>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
