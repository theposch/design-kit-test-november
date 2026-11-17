import {
  ArrowLeft,
  Calendar,
  Columns2,
  Flag,
  Funnel,
  Heart,
  Pencil,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import * as Avatar from '#components/atoms/Avatar';
import { Badge } from '#components/atoms/Badge';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Collapsible from '#components/atoms/Collapsible';
import * as DetailsList from '#components/atoms/DetailsList';
import * as Dialog from '#components/atoms/Dialog';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Layout } from '#components/atoms/Layout';
import * as List from '#components/atoms/List';
import * as Progress from '#components/atoms/Progress';
import { Separator } from '#components/atoms/Separator';
import { Stack } from '#components/atoms/Stack';
import * as Tabs from '#components/atoms/Tabs';
import { Text } from '#components/atoms/Text';
import { TextLink } from '#components/atoms/TextLink';
import { Thumbnail } from '#components/atoms/Thumbnail';
import { Timestamp } from '#components/atoms/Timestamp';
import { IconButton } from '#components/molecules/IconButton';
import { DemoImage } from './parts/DemoImage';
import { useWideScreen } from './parts/useWideScreen';

const LOCALE = 'en-US';
const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
});

const PRODUCTS = [
  {
    name: 'Stoneware mug',
    details: ['Glaze: Snow', 'Finish: Matte'],
    price: 28,
    qty: 2,
  },
  {
    name: 'Oak serving board',
    details: ['Size: Large', 'Finish: Oiled'],
    price: 64,
    qty: 1,
  },
  { name: 'Glass carafe', details: ['Capacity: 1 litre'], price: 36, qty: 1 },
  {
    name: 'Linen napkins',
    details: ['Colour: Sage', 'Set of 4'],
    price: 22,
    qty: 3,
  },
  { name: 'Wool throw', details: ['Colour: Oat'], price: 95, qty: 1 },
];

const SUBTOTAL = PRODUCTS.reduce((sum, p) => sum + p.price * p.qty, 0);
const DISCOUNT = 15;
const TAX = Math.round((SUBTOTAL - DISCOUNT) * 0.0825 * 100) / 100;
const TOTAL = SUBTOTAL - DISCOUNT + TAX;

const ACTIVITY: {
  who: string;
  initials: string;
  text: string;
  when: string;
  likes?: number;
  changes?: string[];
}[] = [
  {
    who: 'Ada Moreno',
    initials: 'AM',
    text: 'placed order 1001',
    when: '2026-02-23T09:12:00',
    likes: 2,
  },
  {
    who: 'Sam Okafor',
    initials: 'SO',
    text: 'The customer asked for the mugs and napkins to be gift wrapped. I added a note to the packing slip.',
    when: '2026-02-23T10:45:00',
    likes: 3,
  },
  {
    who: 'Checkout',
    initials: 'CO',
    text: 'updated the payment details',
    when: '2026-02-23T11:30:00',
    changes: ['Card payment confirmed', 'Fraud check passed, low risk'],
  },
  {
    who: 'Sam Okafor',
    initials: 'SO',
    text: 'marked the order ready to pack',
    when: '2026-02-23T14:15:00',
    likes: 1,
  },
];

function Dot() {
  return (
    <span aria-hidden className="text-muted-foreground">
      ・
    </span>
  );
}

function SectionHeader({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Stack direction="row" gap={2} align="center" justify="between" wrap>
      <Stack direction="row" gap={2} align="center">
        <Heading level={2} register="heading-4">
          {title}
        </Heading>
        {badge}
      </Stack>
      <Stack direction="row" gap={2}>
        {children}
      </Stack>
    </Stack>
  );
}

function Items() {
  return (
    <Card.Root render={<section aria-label="Items" />}>
      <Card.Body>
        <SectionHeader
          title="Items"
          badge={<Badge variant="warning">Unfulfilled</Badge>}
        >
          <Button variant="ghost">Fulfil items</Button>
          <Button variant="outline">Create label</Button>
        </SectionHeader>
        <List.Root>
          {PRODUCTS.map((product, index) => (
            <List.Item key={product.name}>
              <Thumbnail>
                <DemoImage alt={product.name} shade={index} />
              </Thumbnail>
              <List.Content>
                <List.Title>{product.name}</List.Title>
                {product.details.map((line) => (
                  <List.Description key={line}>{line}</List.Description>
                ))}
              </List.Content>
              <List.End>
                <Text register="body-sm" strong>
                  {money.format(product.price * product.qty)}
                </Text>
                <Text register="body-sm" tone="muted">
                  {money.format(product.price)} × {product.qty}
                </Text>
              </List.End>
            </List.Item>
          ))}
        </List.Root>
      </Card.Body>
    </Card.Root>
  );
}

function Row({
  term,
  note,
  amount,
}: {
  term: string;
  note?: string;
  amount: ReactNode;
}) {
  return (
    <DetailsList.Item>
      <DetailsList.Term>{term}</DetailsList.Term>
      <DetailsList.Value className="flex justify-between gap-4">
        <span>{note}</span>
        <span>{amount}</span>
      </DetailsList.Value>
    </DetailsList.Item>
  );
}

function Invoice() {
  return (
    <Card.Root render={<section aria-label="Invoice" />}>
      <Card.Body>
        <SectionHeader
          title="Invoice"
          badge={<Badge variant="success">Paid</Badge>}
        >
          <Button variant="ghost">Refund</Button>
          <Button variant="outline">Send invoice</Button>
        </SectionHeader>
        <DetailsList.Root>
          <Row
            term="Subtotal"
            note={`${PRODUCTS.length} items`}
            amount={money.format(SUBTOTAL)}
          />
          <Row
            term="Discount"
            note="First order code WELCOME15"
            amount={`− ${money.format(DISCOUNT)}`}
          />
          <Row
            term="Shipping"
            note="Standard, free over $100"
            amount={money.format(0)}
          />
          <Row term="Tax" note="Sales tax (8.25%)" amount={money.format(TAX)} />
          <Row
            term="Total"
            amount={<span className="type-strong">{money.format(TOTAL)}</span>}
          />
        </DetailsList.Root>
        <Separator />
        <DetailsList.Root>
          <Row
            term="Paid by customer"
            note="Visa ending 4821"
            amount={money.format(TOTAL)}
          />
        </DetailsList.Root>
      </Card.Body>
    </Card.Root>
  );
}

function Timeline() {
  return (
    <Card.Root render={<section aria-label="Timeline" />}>
      <Card.Body>
        <SectionHeader title="Timeline">
          <IconButton icon={Funnel} label="Filter activity" />
        </SectionHeader>
        <Stack gap={4} render={<ol />}>
          {ACTIVITY.map((entry) => (
            <Stack
              key={entry.when}
              direction="row"
              gap={2}
              align="start"
              render={<li />}
            >
              <Avatar.Root>
                <Avatar.Fallback>{entry.initials}</Avatar.Fallback>
              </Avatar.Root>
              <Stack gap={2} className="min-w-0 flex-1">
                <Card.Root variant="muted" className="rounded-lg">
                  <Stack gap={1} className="p-4">
                    <Text register="body-sm" strong>
                      {entry.who}
                    </Text>
                    <Text register="body-base">{entry.text}</Text>
                    {entry.changes?.map((change) => (
                      <Text
                        key={change}
                        register="body-sm"
                        tone="muted"
                        className="flex items-center gap-2"
                      >
                        <Icon icon={Pencil} />
                        {change}
                      </Text>
                    ))}
                  </Stack>
                </Card.Root>
                <Text
                  register="body-xs"
                  tone="muted"
                  render={<div />}
                  className="flex flex-wrap items-center gap-2"
                >
                  {entry.likes !== undefined && (
                    <span className="flex items-center gap-1">
                      <Icon icon={ThumbsUp} />
                      <Icon icon={Heart} />
                      {entry.likes}
                    </span>
                  )}
                  <span>Like</span>
                  <Dot />
                  <span>Reply</span>
                  <Dot />
                  <Timestamp
                    date={new Date(entry.when)}
                    locale={LOCALE}
                    format="datetime"
                  />
                </Text>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

function PanelContent() {
  return (
    <Stack gap={4}>
      {[
        {
          title: 'Notes',
          body: (
            <Text register="body-base">
              A repeat customer, third order this season. Likes the snow and oat
              glazes and asked for gift wrap.{' '}
              <TextLink href="#notes" tone="muted">
                Show more
              </TextLink>
            </Text>
          ),
        },
        {
          title: 'Customer',
          body: (
            <DetailsList.Root>
              {[
                ['Name', 'Ada Moreno'],
                ['Address', '12 Harbour Street, Portland, OR 97201'],
                ['Phone', '(503) 555-0100'],
                ['Email', 'ada@example.com'],
                ['Billing', 'Same as shipping'],
              ].map(([term, value]) => (
                <DetailsList.Item key={term}>
                  <DetailsList.Term>{term}</DetailsList.Term>
                  <DetailsList.Value>{value}</DetailsList.Value>
                </DetailsList.Item>
              ))}
            </DetailsList.Root>
          ),
        },
        {
          title: 'Fraud check',
          body: (
            <Stack gap={2}>
              <Progress.Root value={15}>
                <Progress.Label>Risk</Progress.Label>
                <Progress.Value />
                <Progress.Track>
                  <Progress.Indicator />
                </Progress.Track>
              </Progress.Root>
              <Text register="body-base">Recommendation: send the order.</Text>
              <Text register="body-base" tone="muted">
                There is little chance of a chargeback on this order.
              </Text>
            </Stack>
          ),
        },
      ].map((section) => (
        <Collapsible.Root key={section.title} defaultOpen>
          <Heading level={2} register="heading-4">
            <Collapsible.Trigger>{section.title}</Collapsible.Trigger>
          </Heading>
          <Collapsible.Panel>{section.body}</Collapsible.Panel>
        </Collapsible.Root>
      ))}
    </Stack>
  );
}

function OrderHeader({
  onTogglePanel,
  panelShown,
}: {
  onTogglePanel: () => void;
  panelShown: boolean;
}) {
  const actions = (
    <>
      <Button variant="outline">Restock</Button>
      <Button variant="outline">Edit</Button>
    </>
  );
  return (
    <Stack gap={4}>
      <Stack direction="row" gap={4} align="start" justify="between">
        <Stack gap={1} className="min-w-0">
          <Text register="body-sm" render={<span />}>
            <TextLink
              href="#orders"
              tone="muted"
              className="inline-flex items-center gap-1"
            >
              <Icon icon={ArrowLeft} />
              All orders
            </TextLink>
          </Text>
          <Heading level={1} register="heading-2">
            Order 1001
          </Heading>
          <Text
            register="body-sm"
            render={<div />}
            className="flex flex-wrap items-center gap-x-2 gap-y-1"
          >
            <span>{PRODUCTS.length} items</span>
            <Dot />
            <span className="flex items-center gap-2">
              <Avatar.Root className="size-6">
                <Avatar.Fallback className="type-body-xs">AM</Avatar.Fallback>
              </Avatar.Root>
              Ada Moreno
            </span>
            <Dot />
            <Badge variant="warning">Unfulfilled</Badge>
            <Dot />
            <span className="flex items-center gap-1">
              <Icon icon={Calendar} className="text-muted-foreground" />
              <Timestamp
                date={new Date('2026-02-23T09:12:00')}
                locale={LOCALE}
              />
            </span>
            <Dot />
            <span className="flex items-center gap-1">
              <Icon icon={Flag} className="text-muted-foreground" />
              Needs attention
            </span>
          </Text>
        </Stack>
        <Stack direction="row" gap={2} className="max-desktop:hidden">
          {actions}
        </Stack>
      </Stack>
      <Grid columns={2} gap={2} className="desktop:hidden">
        {actions}
      </Grid>
      <Stack
        direction="row"
        gap={2}
        align="center"
        justify="between"
        className="-mb-4"
      >
        <Tabs.List className="border-b-0">
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="invoice">Invoice</Tabs.Tab>
          <Tabs.Tab value="timeline">Timeline</Tabs.Tab>
          <Tabs.Indicator />
        </Tabs.List>
        <IconButton
          icon={Columns2}
          label={panelShown ? 'Hide order details' : 'Show order details'}
          aria-pressed={panelShown}
          onClick={onTogglePanel}
        />
      </Stack>
    </Stack>
  );
}

/*
 * One order in full: what was bought, what was paid, what happened. On
 * desktop the details panel sits beside the content; below that width it
 * opens over the page instead, so neither is squeezed.
 */
export function OrderDetail() {
  const wide = useWideScreen();
  const [sidePanel, setSidePanel] = useState(true);
  const [dialog, setDialog] = useState(false);
  const panelShown = wide ? sidePanel : dialog;

  return (
    <Tabs.Root defaultValue="details">
      <Layout
        height="screen"
        header={
          <OrderHeader
            panelShown={panelShown}
            onTogglePanel={() =>
              wide ? setSidePanel(!sidePanel) : setDialog(!dialog)
            }
          />
        }
        end={
          wide && sidePanel
            ? { label: 'Order details', content: <PanelContent /> }
            : undefined
        }
      >
        <Tabs.Panel value="details">
          <Stack gap={4}>
            <Items />
            <Invoice />
            <Timeline />
          </Stack>
        </Tabs.Panel>
        <Tabs.Panel value="invoice">
          <Invoice />
        </Tabs.Panel>
        <Tabs.Panel value="timeline">
          <Timeline />
        </Tabs.Panel>
      </Layout>

      <Dialog.Root open={!wide && dialog} onOpenChange={setDialog}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup>
            <Stack direction="row" align="center" justify="between">
              <Dialog.Title>Order details</Dialog.Title>
              <Dialog.Close
                render={<Button variant="ghost" size="sm" aria-label="Close" />}
              >
                <Icon icon={X} />
              </Dialog.Close>
            </Stack>
            <PanelContent />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </Tabs.Root>
  );
}
