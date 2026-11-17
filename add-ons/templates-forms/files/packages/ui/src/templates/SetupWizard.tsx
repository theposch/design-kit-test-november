import { useId, useRef, useState, type FormEvent } from 'react';

import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Checkbox from '#components/atoms/Checkbox';
import { CheckboxGroup } from '#components/atoms/CheckboxGroup';
import { ChoiceCard } from '#components/atoms/ChoiceCard';
import * as DetailsList from '#components/atoms/DetailsList';
import * as EmptyState from '#components/atoms/EmptyState';
import * as Field from '#components/atoms/Field';
import { Heading } from '#components/atoms/Heading';
import { Layout } from '#components/atoms/Layout';
import * as NumberField from '#components/atoms/NumberField';
import * as Radio from '#components/atoms/Radio';
import { RadioGroup } from '#components/atoms/RadioGroup';
import { Separator } from '#components/atoms/Separator';
import { Stack } from '#components/atoms/Stack';
import * as Stepper from '#components/atoms/Stepper';
import * as Switch from '#components/atoms/Switch';
import { Text } from '#components/atoms/Text';
import { Textarea } from '#components/atoms/Textarea';
import { textOf } from './parts/formData';
import { SelectField, TextField } from './parts/FormFields';

const STEPS = ['Workspace', 'Team', 'Plan', 'Review'] as const;

const REGIONS = [
  { value: 'eu', label: 'Europe (Frankfurt)' },
  { value: 'us', label: 'United States (Virginia)' },
  { value: 'ap', label: 'Asia Pacific (Sydney)' },
];

const PLANS = [
  { value: 'starter', name: 'Starter', price: 0, text: 'For trying it out.' },
  {
    value: 'team',
    name: 'Team',
    price: 12,
    text: 'For teams shipping weekly.',
  },
  {
    value: 'scale',
    name: 'Scale',
    price: 32,
    text: 'For many teams and audits.',
  },
];

const ADDONS = [
  { value: 'backups', label: 'Daily backups', price: 4 },
  { value: 'sso', label: 'Single sign-on', price: 8 },
];

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/* A labelled group of radio buttons, one per line. */
function RadioList({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}) {
  const labelId = useId();
  return (
    <Stack gap={2}>
      <Text id={labelId} register="label-sm" render={<span />}>
        {label}
      </Text>
      <RadioGroup
        aria-labelledby={labelId}
        name={name}
        defaultValue={defaultValue}
      >
        {options.map((option) => (
          <Text
            key={option.value}
            register="body-sm"
            render={<label />}
            className="flex items-center gap-2"
          >
            <Radio.Root value={option.value}>
              <Radio.Indicator />
            </Radio.Root>
            {option.label}
          </Text>
        ))}
      </RadioGroup>
    </Stack>
  );
}

/*
 * A four-step setup in one form: workspace, team, plan, then a review. Each
 * step checks itself before you move on, and Back keeps what you typed.
 */
export function SetupWizard() {
  const form = useRef<HTMLFormElement>(null);
  const planLabel = useId();
  const addonsLabel = useId();
  const [step, setStep] = useState(0);
  const [nameError, setNameError] = useState<string>();
  const [termsError, setTermsError] = useState(false);
  const [plan, setPlan] = useState('team');
  const [seats, setSeats] = useState<number | null>(5);
  const [addons, setAddons] = useState<string[]>([]);
  const [yearly, setYearly] = useState(false);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [created, setCreated] = useState(false);

  const perSeat = PLANS.find((item) => item.value === plan)?.price ?? 0;
  const extras = ADDONS.filter((item) => addons.includes(item.value)).reduce(
    (sum, item) => sum + item.price,
    0,
  );
  const monthly = perSeat * (seats ?? 0) + extras;
  const total = yearly ? Math.round(monthly * 12 * 0.8) : monthly;

  /* Demo only: the workspace needs a name; the review needs the terms. */
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (step === 0) {
      const missing = textOf(data, 'workspace') === '';
      setNameError(missing ? 'Name your workspace.' : undefined);
      if (missing) return;
    }
    if (step === STEPS.length - 1) {
      const agreed = data.get('terms') !== null;
      setTermsError(!agreed);
      if (agreed) setCreated(true);
      return;
    }
    if (step === STEPS.length - 2) {
      setSummary({
        Workspace: textOf(data, 'workspace'),
        Region:
          REGIONS.find((r) => r.value === textOf(data, 'region'))?.label ?? '',
        Invites: textOf(data, 'invites') || 'None yet',
        Plan: `${PLANS.find((item) => item.value === plan)?.name ?? ''}, ${seats ?? 0} seats`,
      });
    }
    setStep(step + 1);
  }

  if (created) {
    return (
      <Layout width="narrow">
        <EmptyState.Root>
          <EmptyState.Title render={<h1 />}>
            Your workspace is ready
          </EmptyState.Title>
          <EmptyState.Description>
            We&apos;ve sent the invites. You can change any of this later in
            settings.
          </EmptyState.Description>
          <EmptyState.Actions>
            <Button>Open workspace</Button>
          </EmptyState.Actions>
        </EmptyState.Root>
      </Layout>
    );
  }

  return (
    <Layout width="narrow">
      <Stack gap={8}>
        <Stack direction="row" justify="between" align="center" gap={4}>
          <Heading level={1} register="heading-2">
            Set up your workspace
          </Heading>
          <Button variant="ghost" type="button">
            Cancel
          </Button>
        </Stack>

        <Stepper.Root aria-label="Setup steps">
          {STEPS.map((name, index) => (
            <Stepper.Item
              key={name}
              status={
                index < step
                  ? 'complete'
                  : index === step
                    ? 'current'
                    : 'upcoming'
              }
            >
              <Stepper.Indicator>{index + 1}</Stepper.Indicator>
              <Stepper.Label className="max-tablet:sr-only">
                {name}
                {index < step && <span className="sr-only"> (done)</span>}
              </Stepper.Label>
              {index < STEPS.length - 1 && <Stepper.Connector />}
            </Stepper.Item>
          ))}
        </Stepper.Root>

        <Card.Root render={<form ref={form} onSubmit={next} noValidate />}>
          <Card.Body className="tablet:p-8 gap-6">
            <Stack gap={6} hidden={step !== 0}>
              <Heading level={2} register="heading-3">
                Name your workspace
              </Heading>
              <TextField
                name="workspace"
                label="Workspace name"
                placeholder="Northwind Studio"
                error={nameError}
              />
              <TextField
                name="slug"
                label="Web address"
                placeholder="northwind"
                description="Your team signs in at northwind.example.com."
              />
              <SelectField
                name="region"
                label="Where we keep your data"
                placeholder="Choose a region"
                options={REGIONS}
                defaultValue="eu"
              />
              <RadioList
                name="access"
                label="Who can join"
                defaultValue="invite"
                options={[
                  { value: 'invite', label: 'Only people I invite' },
                  { value: 'domain', label: 'Anyone with a company email' },
                ]}
              />
            </Stack>

            <Stack gap={6} hidden={step !== 1}>
              <Stack gap={1}>
                <Heading level={2} register="heading-3">
                  Invite your team
                </Heading>
                <Text register="body-sm" tone="muted">
                  Optional. You can invite people later.
                </Text>
              </Stack>
              <Field.Root name="invites">
                <Field.Label>Email addresses</Field.Label>
                <Textarea placeholder="sam@example.com, kai@example.com" />
                <Field.Description>
                  Separate them with commas.
                </Field.Description>
              </Field.Root>
              <RadioList
                name="role"
                label="They join as"
                defaultValue="member"
                options={[
                  { value: 'member', label: 'Members, who can edit' },
                  { value: 'viewer', label: 'Viewers, who can only look' },
                ]}
              />
              <Stack
                direction="row"
                justify="between"
                gap={4}
                render={<label />}
              >
                <Text register="body-sm" render={<span />}>
                  Send a welcome email with the invite
                </Text>
                <Switch.Root name="welcome" defaultChecked>
                  <Switch.Thumb />
                </Switch.Root>
              </Stack>
            </Stack>

            <Stack gap={6} hidden={step !== 2}>
              <Heading level={2} register="heading-3">
                Choose a plan
              </Heading>
              <Stack gap={2}>
                <Text id={planLabel} register="label-sm" render={<span />}>
                  Plan
                </Text>
                <RadioGroup
                  aria-labelledby={planLabel}
                  value={plan}
                  onValueChange={(value) => setPlan(String(value))}
                  className="tablet:grid-cols-3 grid gap-4"
                >
                  {PLANS.map((item) => (
                    <ChoiceCard key={item.value}>
                      <Radio.Root value={item.value}>
                        <Radio.Indicator />
                      </Radio.Root>
                      <span className="flex flex-col gap-1">
                        <span className="type-body-sm type-strong">
                          {item.name}
                        </span>
                        <span className="type-body-sm text-muted-foreground">
                          {money.format(item.price)} a seat a month
                        </span>
                      </span>
                    </ChoiceCard>
                  ))}
                </RadioGroup>
              </Stack>
              <Field.Root className="w-40">
                <Field.Label>Seats</Field.Label>
                <NumberField.Root
                  value={seats}
                  onValueChange={setSeats}
                  min={1}
                  max={500}
                >
                  <NumberField.Group>
                    <NumberField.Decrement label="Fewer seats" />
                    <NumberField.Input />
                    <NumberField.Increment label="More seats" />
                  </NumberField.Group>
                </NumberField.Root>
              </Field.Root>
              <Stack gap={4}>
                <Text id={addonsLabel} register="label-sm" render={<span />}>
                  Add-ons
                </Text>
                <CheckboxGroup
                  aria-labelledby={addonsLabel}
                  value={addons}
                  onValueChange={setAddons}
                >
                  {ADDONS.map((item) => (
                    <Text
                      key={item.value}
                      register="body-sm"
                      render={<label />}
                      className="flex items-center gap-2"
                    >
                      <Checkbox.Root value={item.value}>
                        <Checkbox.Indicator />
                      </Checkbox.Root>
                      {item.label}, {money.format(item.price)} a month
                    </Text>
                  ))}
                </CheckboxGroup>
              </Stack>
              <Stack
                direction="row"
                justify="between"
                gap={4}
                render={<label />}
              >
                <Text register="body-sm" render={<span />}>
                  Pay yearly and save 20%
                </Text>
                <Switch.Root checked={yearly} onCheckedChange={setYearly}>
                  <Switch.Thumb />
                </Switch.Root>
              </Stack>
              <Card.Root variant="muted">
                <Card.Body className="flex-row items-baseline justify-between gap-4">
                  <Text register="body-sm">
                    {yearly ? 'Total a year' : 'Total a month'}
                  </Text>
                  <Text register="body-lg" strong aria-live="polite">
                    {money.format(total)}
                  </Text>
                </Card.Body>
              </Card.Root>
            </Stack>

            <Stack gap={6} hidden={step !== 3}>
              <Heading level={2} register="heading-3">
                Check and create
              </Heading>
              <DetailsList.Root>
                {Object.entries(summary).map(([term, value]) => (
                  <DetailsList.Item key={term}>
                    <DetailsList.Term>{term}</DetailsList.Term>
                    <DetailsList.Value>{value}</DetailsList.Value>
                  </DetailsList.Item>
                ))}
                <DetailsList.Item>
                  <DetailsList.Term>Price</DetailsList.Term>
                  <DetailsList.Value>
                    {money.format(total)} {yearly ? 'a year' : 'a month'}
                  </DetailsList.Value>
                </DetailsList.Item>
              </DetailsList.Root>
              {termsError && (
                <Banner.Root status="destructive">
                  <Banner.Title>Agree to the terms to continue.</Banner.Title>
                </Banner.Root>
              )}
              <Text
                register="body-sm"
                render={<label />}
                className="flex items-center gap-2"
              >
                <Checkbox.Root name="terms">
                  <Checkbox.Indicator />
                </Checkbox.Root>
                I agree to the terms of service
              </Text>
            </Stack>

            <Separator />

            <Stack
              direction="row"
              align="center"
              justify="between"
              gap={4}
              wrap
            >
              <Text register="body-sm" tone="muted">
                Step {step + 1} of {STEPS.length}
              </Text>
              <Stack direction="row" gap={2}>
                {step === 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(2)}
                  >
                    Skip
                  </Button>
                )}
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button type="submit">
                  {step === STEPS.length - 1 ? 'Create workspace' : 'Next'}
                </Button>
              </Stack>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Stack>
    </Layout>
  );
}
