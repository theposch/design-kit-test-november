import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  UserRound,
} from 'lucide-react';
import {
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { Button } from '#components/atoms/Button';
import * as Field from '#components/atoms/Field';
import { Heading } from '#components/atoms/Heading';
import { Input } from '#components/atoms/Input';
import { Layout } from '#components/atoms/Layout';
import { Separator } from '#components/atoms/Separator';
import * as SideNav from '#components/atoms/SideNav';
import { Stack } from '#components/atoms/Stack';
import * as Switch from '#components/atoms/Switch';
import { Text } from '#components/atoms/Text';
import { textOf } from './parts/formData';
import { useWideScreen } from './parts/useWideScreen';

const SECTIONS = [
  { value: 'account', label: 'Account', icon: UserRound },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'region', label: 'Language and region', icon: Globe },
  { value: 'billing', label: 'Billing', icon: CreditCard },
] as const;

type Section = (typeof SECTIONS)[number]['value'];

/* A setting shown as label and value; Edit swaps the value for a field in place. */
function EditableRow({ label, initial }: { label: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValue(textOf(new FormData(event.currentTarget), 'value') || value);
    setEditing(false);
  }

  if (editing) {
    return (
      <Stack gap={4} className="py-4" render={<form onSubmit={save} />}>
        <Field.Root name="value">
          <Field.Label>{label}</Field.Label>
          <Input defaultValue={value} autoFocus />
        </Field.Root>
        <Stack direction="row" gap={2} justify="end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      align="center"
      justify="between"
      gap={4}
      className="py-4"
    >
      <Stack gap={1} className="min-w-0">
        <Text register="body-sm" tone="muted">
          {label}
        </Text>
        <Text lines="1">{value}</Text>
      </Stack>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Edit<span className="sr-only"> {label.toLowerCase()}</span>
      </Button>
    </Stack>
  );
}

function SwitchRow({
  label,
  hint,
  on,
}: {
  label: string;
  hint: string;
  on: boolean;
}) {
  return (
    <Stack
      direction="row"
      align="center"
      justify="between"
      gap={4}
      className="py-4"
      render={<label />}
    >
      <Stack gap={1}>
        <Text render={<span />}>{label}</Text>
        <Text register="body-sm" tone="muted" render={<span />}>
          {hint}
        </Text>
      </Stack>
      <Switch.Root defaultChecked={on}>
        <Switch.Thumb />
      </Switch.Root>
    </Stack>
  );
}

function Rows({ children }: { children: ReactNode[] }) {
  return (
    <Stack>
      {children.map((child, index) => (
        <div key={index}>
          {index > 0 && <Separator />}
          {child}
        </div>
      ))}
    </Stack>
  );
}

const PANES: Record<Section, { description: string; rows: ReactNode[] }> = {
  account: {
    description: 'Your name and how we reach you.',
    rows: [
      <EditableRow key="name" label="Name" initial="Ada Moreno" />,
      <EditableRow key="email" label="Email" initial="ada@example.com" />,
      <EditableRow key="phone" label="Phone" initial="+351 21 000 0000" />,
    ],
  },
  notifications: {
    description: 'Choose what we tell you about, and where.',
    rows: [
      <SwitchRow
        key="mentions"
        label="Mentions"
        hint="When someone mentions you."
        on
      />,
      <SwitchRow
        key="digest"
        label="Weekly digest"
        hint="A Monday summary by email."
        on
      />,
      <SwitchRow
        key="news"
        label="Product news"
        hint="At most once a month."
        on={false}
      />,
    ],
  },
  region: {
    description: 'How dates, times and numbers look to you.',
    rows: [
      <EditableRow key="language" label="Language" initial="English (UK)" />,
      <EditableRow key="zone" label="Time zone" initial="Lisbon (UTC+0)" />,
    ],
  },
  billing: {
    description: 'Your plan and how you pay.',
    rows: [
      <EditableRow key="plan" label="Plan" initial="Team, 8 seats" />,
      <EditableRow
        key="email"
        label="Invoices go to"
        initial="finance@example.com"
      />,
    ],
  },
};

/*
 * Settings split into panels: a list of sections beside the open one on
 * desktop. On tablets and phones the list is its own screen and each
 * section opens with a way back.
 */
export function SettingsPanels() {
  const wide = useWideScreen();
  const [section, setSection] = useState<Section>('account');
  const [browsing, setBrowsing] = useState(true);
  const current =
    SECTIONS.find((item) => item.value === section) ?? SECTIONS[0];
  const pane = PANES[section];

  const nav = (
    <SideNav.Root label="Settings">
      <SideNav.List>
        {SECTIONS.map((item) => (
          <SideNav.Item key={item.value}>
            <SideNav.Link
              href={`#${item.value}`}
              current={wide && item.value === section}
              onClick={(event: MouseEvent) => {
                event.preventDefault();
                setSection(item.value);
                setBrowsing(false);
              }}
            >
              <item.icon aria-hidden />
              {item.label}
              {!wide && (
                <SideNav.LinkEnd>
                  <ChevronRight aria-hidden className="size-4" />
                </SideNav.LinkEnd>
              )}
            </SideNav.Link>
          </SideNav.Item>
        ))}
      </SideNav.List>
    </SideNav.Root>
  );

  if (!wide && browsing) {
    return (
      <Layout width="narrow">
        <Stack gap={6}>
          <Heading level={1} register="heading-2">
            Settings
          </Heading>
          {nav}
        </Stack>
      </Layout>
    );
  }

  return (
    <Layout
      width="narrow"
      start={wide ? { label: 'Settings sections', content: nav } : undefined}
    >
      <Stack gap={6}>
        {!wide && (
          <Button
            variant="ghost"
            className="self-start"
            onClick={() => setBrowsing(true)}
          >
            <ArrowLeft aria-hidden />
            All settings
          </Button>
        )}
        <Stack gap={1}>
          <Heading level={1} register="heading-2">
            {current.label}
          </Heading>
          <Text tone="muted">{pane.description}</Text>
        </Stack>
        <Rows>{pane.rows}</Rows>
      </Stack>
    </Layout>
  );
}
