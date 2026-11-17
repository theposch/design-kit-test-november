import { Hand, Rocket, SlidersHorizontal } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Checkbox from '#components/atoms/Checkbox';
import * as Field from '#components/atoms/Field';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Input } from '#components/atoms/Input';
import { Layout } from '#components/atoms/Layout';
import * as Radio from '#components/atoms/Radio';
import { RadioGroup } from '#components/atoms/RadioGroup';
import * as Select from '#components/atoms/Select';
import { Separator } from '#components/atoms/Separator';
import { Stack } from '#components/atoms/Stack';
import { Tag } from '#components/atoms/Tag';
import { Text } from '#components/atoms/Text';
import { Textarea } from '#components/atoms/Textarea';
import { TextLink } from '#components/atoms/TextLink';
import { ToggleGroup } from '#components/atoms/ToggleGroup';

const PROMISES = [
  {
    icon: Rocket,
    title: 'We start quickly',
    text: 'A first plan on your desk within a week of saying hello.',
  },
  {
    icon: SlidersHorizontal,
    title: 'We shape it to you',
    text: 'Every plan is built around your goals, not a package.',
  },
  {
    icon: Hand,
    title: 'We stay close',
    text: 'One small team that knows your brand from start to finish.',
  },
];

const GOALS = [
  'Brand awareness',
  'Product launch',
  'Sampling',
  'Events',
  'In-store',
  'Trade show',
  'Creators',
  'Community',
  'Seasonal',
  'Something else',
];

const TIMELINES = [
  { value: '30d', label: 'Within 30 days' },
  { value: '1-3m', label: 'In 1 to 3 months' },
  { value: '3-6m', label: 'In 3 to 6 months' },
  { value: '6m+', label: 'In 6 months or more' },
];

const BUDGETS = [
  { value: 's', label: 'Under $5k a month' },
  { value: 'm', label: '$5k to $15k a month' },
  { value: 'l', label: '$15k to $50k a month' },
  { value: 'xl', label: 'Over $50k a month' },
];

const SOURCES = [
  { value: 'social', label: 'Social media' },
  { value: 'friend', label: 'A friend or colleague' },
  { value: 'search', label: 'A search engine' },
  { value: 'event', label: 'An event or talk' },
  { value: 'other', label: 'Somewhere else' },
];

type Errors = Partial<
  Record<
    'name' | 'email' | 'company' | 'phone' | 'goals' | 'timeline' | 'budget',
    string
  >
>;

function ChoiceField({
  name,
  label,
  placeholder,
  options,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <Field.Root name={name} invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Select.Root name={name} items={options}>
        <Select.Trigger>
          <Select.Value placeholder={placeholder} />
          <Select.Icon />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Popup>
              <Select.List>
                {options.map((option) => (
                  <Select.Item key={option.value} value={option.value}>
                    <Select.ItemIndicator />
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {error && <Field.Error match>{error}</Field.Error>}
    </Field.Root>
  );
}

function TextField({
  name,
  label,
  error,
  ...input
}: {
  name: string;
  label: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <Field.Root name={name} invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Input name={name} {...input} />
      {error && <Field.Error match>{error}</Field.Error>}
    </Field.Root>
  );
}

/* A lead form: what we offer, who you are, what you need. */
export function ContactForm() {
  const goalsLabel = useId();
  const sourceLabel = useId();
  const [goals, setGoals] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  /* Demo only: checks the required fields, then shows a thank-you. */
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const filled = (key: string) => {
      const value = data.get(key);
      return typeof value === 'string' && value.trim() !== '';
    };
    const next: Errors = {
      name: filled('name') ? undefined : 'Enter your name.',
      email: filled('email') ? undefined : 'Enter your email.',
      company: filled('company') ? undefined : 'Enter your company.',
      phone: filled('phone') ? undefined : 'Enter a phone number.',
      goals: goals.length > 0 ? undefined : 'Pick at least one goal.',
      timeline: filled('timeline') ? undefined : 'Pick a timeline.',
      budget: filled('budget') ? undefined : 'Pick a budget.',
    };
    setErrors(next);
    setSent(Object.values(next).every((error) => error === undefined));
  }

  return (
    <Layout width="narrow">
      <Stack gap={8} className="tablet:py-4">
        <Stack gap={2} align="center">
          <Heading level={1} align="center">
            Let&apos;s work together
          </Heading>
          <Text tone="muted" align="center" balance>
            Tell us a little about what you&apos;re planning and we&apos;ll be
            in touch within two working days.
          </Text>
        </Stack>

        <Grid columns={{ minWidth: 200 }} gap={4}>
          {PROMISES.map((promise) => (
            <Card.Root key={promise.title}>
              <Card.Body className="gap-2">
                <Icon icon={promise.icon} className="text-primary size-6" />
                <Text strong>{promise.title}</Text>
                <Text register="body-sm" tone="muted">
                  {promise.text}
                </Text>
              </Card.Body>
            </Card.Root>
          ))}
        </Grid>

        {sent ? (
          <Banner.Root status="success">
            <Banner.Title>Thanks, we&apos;ve got your message.</Banner.Title>
            <Banner.Description>
              Someone from the team will reply within two working days.
            </Banner.Description>
          </Banner.Root>
        ) : (
          <Stack gap={6} render={<form onSubmit={send} noValidate />}>
            <Grid columns={{ minWidth: 240 }} gap={4}>
              <TextField
                name="name"
                label="Full name"
                autoComplete="name"
                error={errors.name}
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                error={errors.email}
              />
              <TextField
                name="company"
                label="Company"
                autoComplete="organization"
                error={errors.company}
              />
              <TextField
                name="phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                error={errors.phone}
              />
            </Grid>

            <Separator />

            <Stack gap={2}>
              <Text id={goalsLabel} register="label-sm" render={<span />}>
                What are you aiming for?
              </Text>
              <ToggleGroup
                multiple
                aria-labelledby={goalsLabel}
                value={goals}
                onValueChange={(values) => setGoals(values)}
                className="flex-wrap border-0 bg-transparent p-0"
              >
                {GOALS.map((goal) => (
                  <Tag key={goal} value={goal}>
                    {goal}
                  </Tag>
                ))}
              </ToggleGroup>
              {errors.goals && (
                <Banner.Root status="destructive">
                  <Banner.Title>{errors.goals}</Banner.Title>
                </Banner.Root>
              )}
            </Stack>

            <ChoiceField
              name="timeline"
              label="When would you like to start?"
              placeholder="Choose a timeline"
              options={TIMELINES}
              error={errors.timeline}
            />
            <ChoiceField
              name="budget"
              label="Rough monthly budget"
              placeholder="Choose a budget"
              options={BUDGETS}
              error={errors.budget}
            />

            <Stack gap={2}>
              <Text id={sourceLabel} register="label-sm" render={<span />}>
                How did you hear about us?
              </Text>
              <RadioGroup aria-labelledby={sourceLabel} name="source">
                {SOURCES.map((source) => (
                  <Text
                    key={source.value}
                    register="body-sm"
                    render={<label />}
                    className="flex items-center gap-2"
                  >
                    <Radio.Root value={source.value}>
                      <Radio.Indicator />
                    </Radio.Root>
                    {source.label}
                  </Text>
                ))}
              </RadioGroup>
            </Stack>

            <Field.Root name="message">
              <Field.Label>Anything else?</Field.Label>
              <Textarea placeholder="Tell us whatever else is on your mind" />
            </Field.Root>

            <Text
              register="body-sm"
              render={<label />}
              className="flex items-center gap-2"
            >
              <Checkbox.Root name="decider">
                <Checkbox.Indicator />
              </Checkbox.Root>
              I decide on the budget
            </Text>

            <Stack gap={4}>
              <Button type="submit" size="lg">
                Send
              </Button>
              <Text register="body-xs" tone="muted" align="center">
                By sending this you agree to our{' '}
                <TextLink href="#privacy">Privacy Policy</TextLink>.
              </Text>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Layout>
  );
}
