import {
  Bell,
  CreditCard,
  KeyRound,
  Plug,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

import * as Avatar from '#components/atoms/Avatar';
import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Checkbox from '#components/atoms/Checkbox';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Layout } from '#components/atoms/Layout';
import { Stack } from '#components/atoms/Stack';
import * as Switch from '#components/atoms/Switch';
import * as Tabs from '#components/atoms/Tabs';
import { Text } from '#components/atoms/Text';
import { SelectField, TextField } from './parts/FormFields';
import { textOf } from './parts/formData';
import { useWideScreen } from './parts/useWideScreen';

const SECTIONS = [
  { value: 'profile', label: 'Profile', icon: UserRound },
  { value: 'security', label: 'Security', icon: KeyRound },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'billing', label: 'Billing', icon: CreditCard },
  { value: 'integrations', label: 'Integrations', icon: Plug },
  { value: 'privacy', label: 'Privacy', icon: ShieldCheck },
];

const TIME_ZONES = [
  { value: 'america-new-york', label: 'New York (UTC−5)' },
  { value: 'europe-london', label: 'London (UTC+0)' },
  { value: 'europe-berlin', label: 'Berlin (UTC+1)' },
  { value: 'asia-tokyo', label: 'Tokyo (UTC+9)' },
];

const ALERTS = [
  {
    name: 'mentions',
    label: 'Mentions',
    hint: 'When someone mentions you in a comment.',
    on: true,
  },
  {
    name: 'digest',
    label: 'Weekly digest',
    hint: 'A Monday summary of what changed in your projects.',
    on: true,
  },
  {
    name: 'product',
    label: 'Product news',
    hint: 'New features, at most once a month.',
    on: false,
  },
];

/* A titled card of settings with its own save button and saved message. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [saved, setSaved] = useState(false);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }
  return (
    <Card.Root render={<form onSubmit={save} noValidate />}>
      <Card.Body className="gap-6">
        <Stack gap={1}>
          <Heading level={2} register="heading-4">
            {title}
          </Heading>
          <Text register="body-sm" tone="muted">
            {description}
          </Text>
        </Stack>
        {children}
        <Stack direction="row" align="center" justify="end" gap={4} wrap>
          {saved && (
            <Text register="body-sm" tone="muted" role="status">
              Saved
            </Text>
          )}
          <Button
            type="submit"
            variant="outline"
            onClick={() => setSaved(false)}
          >
            Save {title.toLowerCase()}
          </Button>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

function ProfilePanel() {
  return (
    <Stack gap={6}>
      <Section
        title="Profile"
        description="How you appear to people in your workspace."
      >
        <Stack direction="row" align="center" gap={4}>
          <Avatar.Root className="size-16">
            <Avatar.Fallback>AM</Avatar.Fallback>
          </Avatar.Root>
          <Button variant="outline" size="sm" type="button">
            Change photo
          </Button>
        </Stack>
        <Grid columns={{ minWidth: 240 }} gap={4}>
          <TextField
            name="name"
            label="Full name"
            autoComplete="name"
            defaultValue="Ada Moreno"
          />
          <TextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            defaultValue="ada@example.com"
          />
          <TextField name="title" label="Job title" defaultValue="Designer" />
          <SelectField
            name="zone"
            label="Time zone"
            placeholder="Choose a time zone"
            options={TIME_ZONES}
            defaultValue="europe-london"
          />
        </Grid>
      </Section>
      <Section
        title="Notifications"
        description="Choose what we email you about."
      >
        <Stack gap={4}>
          {ALERTS.map((alert) => (
            <Stack
              key={alert.name}
              direction="row"
              justify="between"
              gap={4}
              render={<label />}
            >
              <Stack gap={1}>
                <Text register="body-sm" render={<span />}>
                  {alert.label}
                </Text>
                <Text register="body-sm" tone="muted" render={<span />}>
                  {alert.hint}
                </Text>
              </Stack>
              <Switch.Root name={alert.name} defaultChecked={alert.on}>
                <Switch.Thumb />
              </Switch.Root>
            </Stack>
          ))}
        </Stack>
      </Section>
    </Stack>
  );
}

function SecurityPanel() {
  const [error, setError] = useState<string>();
  const [changed, setChanged] = useState(false);

  /* Demo only: the new password must be long enough and typed twice. */
  function change(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = textOf(data, 'new');
    const problem =
      next.length < 12
        ? 'Use at least 12 characters.'
        : next !== textOf(data, 'confirm')
          ? 'The two new passwords do not match.'
          : undefined;
    setError(problem);
    setChanged(problem === undefined);
  }

  return (
    <Stack gap={6}>
      <Card.Root render={<form onSubmit={change} noValidate />}>
        <Card.Body className="gap-6">
          <Stack gap={1}>
            <Heading level={2} register="heading-4">
              Password
            </Heading>
            <Text register="body-sm" tone="muted">
              Use at least 12 characters. A short sentence works well.
            </Text>
          </Stack>
          {changed && (
            <Banner.Root status="success">
              <Banner.Title>Password changed.</Banner.Title>
            </Banner.Root>
          )}
          <Grid columns={{ minWidth: 240 }} gap={4}>
            <TextField
              name="current"
              label="Current password"
              type="password"
              autoComplete="current-password"
            />
            <TextField
              name="new"
              label="New password"
              type="password"
              autoComplete="new-password"
              error={error}
            />
            <TextField
              name="confirm"
              label="Type it again"
              type="password"
              autoComplete="new-password"
            />
          </Grid>
          <Stack direction="row" justify="end">
            <Button type="submit" variant="outline">
              Change password
            </Button>
          </Stack>
        </Card.Body>
      </Card.Root>
      <Section
        title="Sign-in"
        description="Extra steps that keep your account safe."
      >
        <Stack gap={4}>
          {[
            ['twofactor', 'Ask for a code from my phone', true],
            ['alerts', 'Email me when a new device signs in', true],
            ['sessions', 'Sign me out after 30 days', false],
          ].map(([name, label, on]) => (
            <Text
              key={String(name)}
              register="body-sm"
              render={<label />}
              className="flex items-center gap-2"
            >
              <Checkbox.Root name={String(name)} defaultChecked={Boolean(on)}>
                <Checkbox.Indicator />
              </Checkbox.Root>
              {label}
            </Text>
          ))}
        </Stack>
      </Section>
    </Stack>
  );
}

/*
 * Account settings: a list of sections down the side on desktop, tabs across
 * the top on tablets and phones, and a card per group with its own save.
 */
export function Settings() {
  const wide = useWideScreen();
  return (
    <Layout width="wide">
      <Stack gap={8}>
        <Stack gap={2}>
          <Heading level={1}>Settings</Heading>
          <Text tone="muted">Manage your profile, security and alerts.</Text>
        </Stack>
        <Tabs.Root
          defaultValue="profile"
          orientation={wide ? 'vertical' : 'horizontal'}
          className="desktop:flex-row desktop:gap-8"
        >
          <Tabs.List
            aria-label="Settings sections"
            className="desktop:w-56 desktop:shrink-0 desktop:flex-col desktop:self-start desktop:border-b-0 scrollbar-none overflow-x-auto"
          >
            {SECTIONS.map((section) => (
              <Tabs.Tab
                key={section.value}
                value={section.value}
                className="desktop:justify-start desktop:data-active:bg-muted"
              >
                <Icon icon={section.icon} />
                {section.label}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator className="desktop:hidden" />
          </Tabs.List>
          <div className="min-w-0 flex-1">
            <Tabs.Panel value="profile">
              <ProfilePanel />
            </Tabs.Panel>
            <Tabs.Panel value="security">
              <SecurityPanel />
            </Tabs.Panel>
            {SECTIONS.slice(2).map((section) => (
              <Tabs.Panel key={section.value} value={section.value}>
                <Card.Root variant="muted">
                  <Card.Body className="items-center gap-2 py-12">
                    <Icon
                      icon={section.icon}
                      className="text-muted-foreground size-6"
                    />
                    <Text strong>{section.label}</Text>
                    <Text register="body-sm" tone="muted" align="center">
                      Put the {section.label.toLowerCase()} settings here.
                    </Text>
                  </Card.Body>
                </Card.Root>
              </Tabs.Panel>
            ))}
          </div>
        </Tabs.Root>
      </Stack>
    </Layout>
  );
}
