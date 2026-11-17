import { Clock, Mail, MapPin } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import { AspectRatio } from '#components/atoms/AspectRatio';
import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Field from '#components/atoms/Field';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Layout } from '#components/atoms/Layout';
import { Stack } from '#components/atoms/Stack';
import { Tag } from '#components/atoms/Tag';
import { Text } from '#components/atoms/Text';
import { Textarea } from '#components/atoms/Textarea';
import { ToggleGroup } from '#components/atoms/ToggleGroup';
import { DemoImage } from './parts/DemoImage';
import { textOf } from './parts/formData';
import { SelectField, TextField } from './parts/FormFields';

const TOPICS = ['A new project', 'Support', 'Partnership', 'Press'];

const BUDGETS = [
  { value: 's', label: 'Under $10k' },
  { value: 'm', label: '$10k to $50k' },
  { value: 'l', label: 'Over $50k' },
  { value: 'unsure', label: 'Not sure yet' },
];

const CONTACTS = [
  { icon: Mail, title: 'Email', text: 'hello@example.com' },
  { icon: MapPin, title: 'Studio', text: '12 Harbour Street, Lisbon' },
  { icon: Clock, title: 'Hours', text: 'Monday to Friday, 9 to 6' },
];

type Errors = Partial<Record<'name' | 'email' | 'topic' | 'message', string>>;

/* A pitch on one side and a short form on the other; they stack on phones. */
export function TwoColumnForm() {
  const topicLabel = useId();
  const [topic, setTopic] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  /* Demo only: checks the required fields, then shows a thank-you. */
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Errors = {
      name: textOf(data, 'name') ? undefined : 'Required',
      email: textOf(data, 'email') ? undefined : 'Required',
      topic: topic.length > 0 ? undefined : 'Required',
      message: textOf(data, 'message') ? undefined : 'Required',
    };
    setErrors(next);
    setSent(Object.values(next).every((error) => error === undefined));
  }

  return (
    <Layout>
      <Stack gap={12} className="tablet:py-4">
        <Grid columns={{ minWidth: 360, max: 2 }} gap={8} align="start">
          <Stack gap={6}>
            <Stack gap={4}>
              <Heading level={1}>Tell us what you&apos;re building</Heading>
              <Text tone="muted" register="body-lg">
                A few lines is plenty. We read every message and reply within a
                working day.
              </Text>
            </Stack>
            <Card.Root variant="muted">
              <AspectRatio ratio="4/3">
                <DemoImage alt="The studio team at work" />
              </AspectRatio>
            </Card.Root>
          </Stack>

          <Card.Root>
            <Card.Body className="tablet:p-8 gap-6">
              {sent ? (
                <Banner.Root status="success">
                  <Banner.Title>Message sent. Thank you!</Banner.Title>
                  <Banner.Description>
                    We&apos;ll reply to you by email within a working day.
                  </Banner.Description>
                </Banner.Root>
              ) : (
                <Stack gap={4} render={<form onSubmit={send} noValidate />}>
                  <TextField
                    name="name"
                    label="Full name"
                    autoComplete="name"
                    error={errors.name}
                  />
                  <Grid columns={{ minWidth: 200 }} gap={4}>
                    <TextField
                      name="email"
                      label="Email"
                      type="email"
                      autoComplete="email"
                      error={errors.email}
                    />
                    <TextField
                      name="company"
                      label="Company"
                      autoComplete="organization"
                    />
                    <TextField
                      name="role"
                      label="Job title"
                      autoComplete="organization-title"
                    />
                    <TextField
                      name="phone"
                      label="Phone"
                      type="tel"
                      autoComplete="tel"
                    />
                  </Grid>
                  <Stack gap={2}>
                    <Text id={topicLabel} register="label-sm" render={<span />}>
                      What is it about?
                    </Text>
                    <ToggleGroup
                      aria-labelledby={topicLabel}
                      value={topic}
                      onValueChange={(values) => setTopic(values)}
                      className="flex-wrap border-0 bg-transparent p-0"
                    >
                      {TOPICS.map((item) => (
                        <Tag key={item} value={item}>
                          {item}
                        </Tag>
                      ))}
                    </ToggleGroup>
                    {errors.topic && (
                      <Text register="body-sm" tone="destructive" role="alert">
                        Pick a topic.
                      </Text>
                    )}
                  </Stack>
                  <SelectField
                    name="budget"
                    label="Budget"
                    placeholder="Choose a range"
                    options={BUDGETS}
                  />
                  <Field.Root name="message" invalid={Boolean(errors.message)}>
                    <Field.Label>Message</Field.Label>
                    <Textarea placeholder="What would you like to talk about?" />
                    {errors.message && (
                      <Field.Error match>{errors.message}</Field.Error>
                    )}
                  </Field.Root>
                  <Button type="submit" size="lg">
                    Send message
                  </Button>
                </Stack>
              )}
            </Card.Body>
          </Card.Root>
        </Grid>

        <Grid columns={{ minWidth: 200, max: 3 }} gap={4}>
          {CONTACTS.map((contact) => (
            <Stack key={contact.title} direction="row" gap={4}>
              <Icon icon={contact.icon} className="text-primary size-6" />
              <Stack gap={1}>
                <Text strong>{contact.title}</Text>
                <Text register="body-sm" tone="muted">
                  {contact.text}
                </Text>
              </Stack>
            </Stack>
          ))}
        </Grid>
      </Stack>
    </Layout>
  );
}
