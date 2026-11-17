import { CalendarClock, X } from 'lucide-react';
import { Fragment, useId, useState, type FormEvent } from 'react';

import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Checkbox from '#components/atoms/Checkbox';
import { CheckboxGroup } from '#components/atoms/CheckboxGroup';
import * as Combobox from '#components/atoms/Combobox';
import * as Dialog from '#components/atoms/Dialog';
import * as EmptyState from '#components/atoms/EmptyState';
import * as Field from '#components/atoms/Field';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Input } from '#components/atoms/Input';
import { Layout } from '#components/atoms/Layout';
import * as Radio from '#components/atoms/Radio';
import { RadioGroup } from '#components/atoms/RadioGroup';
import { Separator } from '#components/atoms/Separator';
import { Stack } from '#components/atoms/Stack';
import * as Stepper from '#components/atoms/Stepper';
import * as Switch from '#components/atoms/Switch';
import { Text } from '#components/atoms/Text';
import * as Toast from '#components/atoms/Toast';
import { Toggle } from '#components/atoms/Toggle';
import { ToggleGroup } from '#components/atoms/ToggleGroup';
import { Toaster } from '#components/molecules/Toaster';
import { useToastManager } from '#hooks/useToastManager';
import { textOf } from './parts/formData';
import { SelectField, TextField } from './parts/FormFields';

const STEPS = ['Report', 'Schedule', 'Delivery'] as const;

const SECTIONS = [
  { value: 'summary', label: 'Summary' },
  { value: 'revenue', label: 'Revenue by region' },
  { value: 'funnel', label: 'Sign-up funnel' },
  { value: 'churn', label: 'Churn' },
];

const PEOPLE = [
  'ada@example.com',
  'kai@example.com',
  'sam@example.com',
  'team-finance@example.com',
];

type Errors = Partial<Record<'name' | 'sections' | 'recipients', string>>;

/* Schedule-a-report steps inside the dialog. Each step checks itself. */
function ScheduleForm({ onDone }: { onDone: (name: string) => void }) {
  const sectionsLabel = useId();
  const cadenceLabel = useId();
  const formatLabel = useId();
  const [step, setStep] = useState(0);
  const [sections, setSections] = useState<string[]>(['summary']);
  const [cadence, setCadence] = useState(['weekly']);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const found: Errors =
      step === 0
        ? {
            name: textOf(data, 'name') ? undefined : 'Name the report.',
            sections:
              sections.length > 0 ? undefined : 'Pick at least one section.',
          }
        : step === 2
          ? {
              recipients:
                recipients.length > 0
                  ? undefined
                  : 'Add someone to send it to.',
            }
          : {};
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    if (step === STEPS.length - 1) onDone(textOf(data, 'name'));
    else setStep(step + 1);
  }

  const problems = Object.values(errors).filter(Boolean).length;

  return (
    <Stack gap={6} render={<form onSubmit={next} noValidate />}>
      <Stepper.Root aria-label="Steps">
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
            <Stepper.Label>
              {name}
              {index < step && <span className="sr-only"> (done)</span>}
            </Stepper.Label>
            {index < STEPS.length - 1 && <Stepper.Connector />}
          </Stepper.Item>
        ))}
      </Stepper.Root>

      <Stack gap={4} hidden={step !== 0}>
        <TextField
          name="name"
          label="Report name"
          placeholder="Weekly numbers"
          error={errors.name}
        />
        <SelectField
          name="dataset"
          label="Data from"
          placeholder="Choose a source"
          defaultValue="sales"
          options={[
            { value: 'sales', label: 'Sales' },
            { value: 'product', label: 'Product usage' },
            { value: 'support', label: 'Support' },
          ]}
        />
        <Stack gap={2}>
          <Text id={sectionsLabel} register="label-sm" render={<span />}>
            Include
          </Text>
          <CheckboxGroup
            aria-labelledby={sectionsLabel}
            value={sections}
            onValueChange={setSections}
          >
            {SECTIONS.map((item) => (
              <Text
                key={item.value}
                register="body-sm"
                render={<label />}
                className="flex items-center gap-2"
              >
                <Checkbox.Root value={item.value}>
                  <Checkbox.Indicator />
                </Checkbox.Root>
                {item.label}
              </Text>
            ))}
          </CheckboxGroup>
          {errors.sections && (
            <Text register="body-sm" tone="destructive">
              {errors.sections}
            </Text>
          )}
        </Stack>
      </Stack>

      <Stack gap={4} hidden={step !== 1}>
        <Stack gap={2}>
          <Text id={cadenceLabel} register="label-sm" render={<span />}>
            How often
          </Text>
          <ToggleGroup
            aria-labelledby={cadenceLabel}
            value={cadence}
            onValueChange={(value) => value.length > 0 && setCadence(value)}
            className="w-fit"
          >
            <Toggle value="daily">Daily</Toggle>
            <Toggle value="weekly">Weekly</Toggle>
            <Toggle value="monthly">Monthly</Toggle>
          </ToggleGroup>
        </Stack>
        <Grid columns={{ minWidth: 160 }} gap={4}>
          {cadence[0] === 'weekly' && (
            <SelectField
              name="weekday"
              label="On"
              placeholder="Choose a day"
              defaultValue="mon"
              options={[
                { value: 'mon', label: 'Monday' },
                { value: 'wed', label: 'Wednesday' },
                { value: 'fri', label: 'Friday' },
              ]}
            />
          )}
          <Field.Root name="time">
            <Field.Label>At</Field.Label>
            <Input type="time" defaultValue="09:00" />
          </Field.Root>
          <Field.Root name="start">
            <Field.Label>Starting</Field.Label>
            <Input type="date" defaultValue="2026-03-09" />
          </Field.Root>
        </Grid>
        <Banner.Root status="info">
          <Banner.Description>
            Times use each person&apos;s own time zone, so 9:00 means 9:00
            wherever they are.
          </Banner.Description>
        </Banner.Root>
      </Stack>

      <Stack gap={4} hidden={step !== 2}>
        <Combobox.Root
          items={PEOPLE}
          multiple
          value={recipients}
          onValueChange={setRecipients}
        >
          <Field.Root invalid={Boolean(errors.recipients)}>
            <Field.Label>Send to</Field.Label>
            <Combobox.InputGroup>
              <Combobox.Chips>
                <Combobox.Value>
                  {(chosen: string[]) => (
                    <Fragment>
                      {chosen.map((email) => (
                        <Combobox.Chip key={email} aria-label={email}>
                          {email}
                          <Combobox.ChipRemove label={`Remove ${email}`} />
                        </Combobox.Chip>
                      ))}
                      <Combobox.Input
                        placeholder={
                          chosen.length > 0 ? '' : 'Type a name or email'
                        }
                      />
                    </Fragment>
                  )}
                </Combobox.Value>
              </Combobox.Chips>
            </Combobox.InputGroup>
            {errors.recipients && (
              <Text register="body-sm" tone="destructive">
                {errors.recipients}
              </Text>
            )}
          </Field.Root>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Empty>Nobody matches.</Combobox.Empty>
                <Combobox.List>
                  {(email: string) => (
                    <Combobox.Item key={email} value={email}>
                      <Combobox.ItemIndicator />
                      {email}
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>
        <Stack gap={2}>
          <Text id={formatLabel} register="label-sm" render={<span />}>
            As
          </Text>
          <RadioGroup
            aria-labelledby={formatLabel}
            name="format"
            defaultValue="pdf"
          >
            {[
              ['pdf', 'A PDF attachment'],
              ['link', 'A link to the live report'],
            ].map(([value, label]) => (
              <Text
                key={value}
                register="body-sm"
                render={<label />}
                className="flex items-center gap-2"
              >
                <Radio.Root value={value}>
                  <Radio.Indicator />
                </Radio.Root>
                {label}
              </Text>
            ))}
          </RadioGroup>
        </Stack>
        <Stack direction="row" justify="between" gap={4} render={<label />}>
          <Text register="body-sm" render={<span />}>
            Skip it when nothing changed
          </Text>
          <Switch.Root name="skipEmpty" defaultChecked>
            <Switch.Thumb />
          </Switch.Root>
        </Stack>
      </Stack>

      <Separator />
      <Stack direction="row" align="center" justify="between" gap={4} wrap>
        <Text
          register="body-sm"
          tone={problems > 0 ? 'destructive' : 'muted'}
          aria-live="polite"
        >
          {problems > 0
            ? `${problems} ${problems === 1 ? 'field needs' : 'fields need'} attention`
            : `Step ${step + 1} of ${STEPS.length}`}
        </Text>
        <Stack direction="row" gap={2}>
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
            {step === STEPS.length - 1 ? 'Schedule' : 'Next'}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

function ReportsPage() {
  const toasts = useToastManager();
  const [open, setOpen] = useState(false);
  return (
    <Layout width="narrow">
      <Stack gap={8}>
        <Stack direction="row" justify="between" align="center" gap={4} wrap>
          <Heading level={1} register="heading-2">
            Reports
          </Heading>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger render={<Button />}>
              Schedule a report
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop />
              <Dialog.Popup className="max-w-xl">
                <Stack direction="row" align="center" justify="between">
                  <Dialog.Title>Schedule a report</Dialog.Title>
                  <Dialog.Close
                    render={
                      <Button variant="ghost" size="sm" aria-label="Close" />
                    }
                  >
                    <Icon icon={X} />
                  </Dialog.Close>
                </Stack>
                <ScheduleForm
                  onDone={(name) => {
                    setOpen(false);
                    toasts.add({
                      title: 'Report scheduled',
                      description: `“${name}” goes out on the next run.`,
                    });
                  }}
                />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </Stack>
        <EmptyState.Root>
          <EmptyState.Media>
            <Icon icon={CalendarClock} className="size-6" />
          </EmptyState.Media>
          <EmptyState.Title>No scheduled reports yet</EmptyState.Title>
          <EmptyState.Description>
            Schedule one and it lands in people&apos;s inboxes on its own.
          </EmptyState.Description>
        </EmptyState.Root>
      </Stack>
    </Layout>
  );
}

/* A page with a short wizard that opens in a dialog, then confirms with a toast. */
export function DialogWizard() {
  return (
    <Toast.Provider>
      <ReportsPage />
      <Toaster label="Notifications" closeLabel="Dismiss" />
    </Toast.Provider>
  );
}
