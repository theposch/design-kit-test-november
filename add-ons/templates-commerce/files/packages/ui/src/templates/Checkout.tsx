import { Lock } from 'lucide-react';
import { useId, useState, type FormEvent, type ReactNode } from 'react';

import * as Banner from '#components/atoms/Banner';
import { Button } from '#components/atoms/Button';
import * as Card from '#components/atoms/Card';
import * as Checkbox from '#components/atoms/Checkbox';
import { ChoiceCard } from '#components/atoms/ChoiceCard';
import * as Collapsible from '#components/atoms/Collapsible';
import * as Field from '#components/atoms/Field';
import { Grid } from '#components/atoms/Grid';
import { Heading } from '#components/atoms/Heading';
import { Icon } from '#components/atoms/Icon';
import { Input } from '#components/atoms/Input';
import { Layout } from '#components/atoms/Layout';
import * as NumberField from '#components/atoms/NumberField';
import * as Radio from '#components/atoms/Radio';
import { RadioGroup } from '#components/atoms/RadioGroup';
import { Separator } from '#components/atoms/Separator';
import { Stack } from '#components/atoms/Stack';
import * as Stepper from '#components/atoms/Stepper';
import { Text } from '#components/atoms/Text';
import { Thumbnail } from '#components/atoms/Thumbnail';
import { DemoImage } from './parts/DemoImage';
import { textOf } from './parts/formData';
import { SelectField, TextField } from './parts/FormFields';
import { useWideScreen } from './parts/useWideScreen';

const STEPS = ['Cart', 'Shipping', 'Delivery', 'Payment'] as const;

const ITEMS = [
  { id: 'mug', name: 'Stoneware mug', detail: 'Snow, matte', price: 28 },
  { id: 'board', name: 'Oak serving board', detail: 'Large', price: 64 },
  { id: 'carafe', name: 'Glass carafe', detail: '1 litre', price: 36 },
];

const SPEEDS = [
  {
    value: 'standard',
    name: 'Standard',
    when: '3 to 5 working days',
    price: 0,
  },
  { value: 'express', name: 'Express', when: '1 to 2 working days', price: 9 },
  { value: 'next', name: 'Next day', when: 'Order before 2pm', price: 18 },
];

const COUNTRIES = [
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ie', label: 'Ireland' },
  { value: 'pt', label: 'Portugal' },
  { value: 'us', label: 'United States' },
];

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

type Errors = Partial<Record<'name' | 'address' | 'card', string>>;

function SummaryLines({
  quantities,
  shipping,
  discount,
}: {
  quantities: Record<string, number>;
  shipping: number;
  discount: number;
}) {
  const subtotal = ITEMS.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
    0,
  );
  const row = (label: string, value: number, strong = false) => (
    <Stack direction="row" justify="between" gap={4}>
      <Text register={strong ? 'body-base' : 'body-sm'} strong={strong}>
        {label}
      </Text>
      <Text register={strong ? 'body-base' : 'body-sm'} strong={strong}>
        {money.format(value)}
      </Text>
    </Stack>
  );
  return (
    <Stack gap={4}>
      {ITEMS.filter((item) => (quantities[item.id] ?? 0) > 0).map((item) => (
        <Stack key={item.id} direction="row" align="center" gap={4}>
          <Thumbnail>
            <DemoImage alt={item.name} />
          </Thumbnail>
          <Stack gap={1} className="flex-1">
            <Text register="body-sm">{item.name}</Text>
            <Text register="body-xs" tone="muted">
              {quantities[item.id]} × {money.format(item.price)}
            </Text>
          </Stack>
          <Text register="body-sm">
            {money.format(item.price * (quantities[item.id] ?? 0))}
          </Text>
        </Stack>
      ))}
      <Separator />
      <Stack gap={2}>
        {row('Subtotal', subtotal)}
        {discount > 0 && row('Promo code', -discount)}
        {row('Shipping', shipping)}
      </Stack>
      <Separator />
      {row('Total', subtotal - discount + shipping, true)}
    </Stack>
  );
}

function StepSection({
  hidden,
  title,
  children,
}: {
  hidden: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={6} hidden={hidden}>
      <Heading level={2} register="heading-3">
        {title}
      </Heading>
      {children}
    </Stack>
  );
}

/*
 * A four-step checkout: cart, shipping, delivery, payment. The order summary
 * stays beside the form on desktop and folds away above it on smaller screens.
 */
export function Checkout() {
  const wide = useWideScreen();
  const speedLabel = useId();
  const [step, setStep] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({
    mug: 2,
    board: 1,
    carafe: 1,
  });
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [speed, setSpeed] = useState('standard');
  const [errors, setErrors] = useState<Errors>({});
  const [placed, setPlaced] = useState(false);

  const shipping = SPEEDS.find((item) => item.value === speed)?.price ?? 0;
  const total =
    ITEMS.reduce(
      (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
      0,
    ) -
    discount +
    shipping;

  /* Demo only: checks the step's required fields before moving on. */
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextErrors: Errors =
      step === 1
        ? {
            name: textOf(data, 'name') ? undefined : 'Enter your full name.',
            address: textOf(data, 'address')
              ? undefined
              : 'Enter a street address.',
          }
        : step === 3
          ? {
              card: textOf(data, 'card')
                ? undefined
                : 'Enter your card number.',
            }
          : {};
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    if (step === STEPS.length - 1) setPlaced(true);
    else setStep(step + 1);
  }

  const summary = (
    <SummaryLines
      quantities={quantities}
      shipping={shipping}
      discount={discount}
    />
  );

  return (
    <Layout>
      <Stack gap={8}>
        <Stack direction="row" justify="between" align="center" gap={4} wrap>
          <Heading level={1} register="heading-2">
            Checkout
          </Heading>
          <Text
            register="body-sm"
            tone="muted"
            className="flex items-center gap-2"
          >
            <Icon icon={Lock} className="size-4" />
            Secure checkout
          </Text>
        </Stack>

        <div className="desktop:grid-cols-3 grid items-start gap-8">
          {!wide && (
            <Collapsible.Root>
              <Card.Root variant="muted">
                <Card.Body>
                  <Collapsible.Trigger>
                    Order summary, {money.format(total)}
                  </Collapsible.Trigger>
                  <Collapsible.Panel>
                    <div className="pt-4">{summary}</div>
                  </Collapsible.Panel>
                </Card.Body>
              </Card.Root>
            </Collapsible.Root>
          )}

          <Stack gap={8} className="desktop:col-span-2">
            <Stepper.Root aria-label="Checkout steps">
              {STEPS.map((name, index) => (
                <Stepper.Item
                  key={name}
                  status={
                    placed || index < step
                      ? 'complete'
                      : index === step
                        ? 'current'
                        : 'upcoming'
                  }
                >
                  <Stepper.Indicator>{index + 1}</Stepper.Indicator>
                  <Stepper.Label className="max-tablet:sr-only">
                    {name}
                    {(placed || index < step) && (
                      <span className="sr-only"> (done)</span>
                    )}
                  </Stepper.Label>
                  {index < STEPS.length - 1 && <Stepper.Connector />}
                </Stepper.Item>
              ))}
            </Stepper.Root>

            {placed ? (
              <Banner.Root status="success">
                <Banner.Title>Order placed. Thank you!</Banner.Title>
                <Banner.Description>
                  We&apos;ve emailed your receipt and will send tracking once it
                  ships.
                </Banner.Description>
              </Banner.Root>
            ) : (
              <Stack gap={8} render={<form onSubmit={next} noValidate />}>
                <StepSection hidden={step !== 0} title="Your cart">
                  <Stack gap={4}>
                    {ITEMS.map((item) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        align="center"
                        gap={4}
                        wrap
                      >
                        <Thumbnail className="size-16">
                          <DemoImage alt={item.name} />
                        </Thumbnail>
                        <Stack gap={1} className="flex-1">
                          <Text strong>{item.name}</Text>
                          <Text register="body-sm" tone="muted">
                            {item.detail}, {money.format(item.price)}
                          </Text>
                        </Stack>
                        <NumberField.Root
                          aria-label={`${item.name} quantity`}
                          value={quantities[item.id] ?? 0}
                          onValueChange={(value) =>
                            setQuantities({
                              ...quantities,
                              [item.id]: value ?? 0,
                            })
                          }
                          min={0}
                          max={20}
                          className="w-32"
                        >
                          <NumberField.Group size="sm">
                            <NumberField.Decrement
                              label={`Fewer ${item.name}`}
                            />
                            <NumberField.Input
                              aria-label={`${item.name} quantity`}
                            />
                            <NumberField.Increment
                              label={`More ${item.name}`}
                            />
                          </NumberField.Group>
                        </NumberField.Root>
                      </Stack>
                    ))}
                  </Stack>
                  <Field.Root name="promo">
                    <Field.Label>Promo code</Field.Label>
                    <Stack direction="row" gap={2}>
                      <Input
                        value={promo}
                        onChange={(event) => setPromo(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setDiscount(promo.trim() === '' ? 0 : 10)
                        }
                      >
                        Apply
                      </Button>
                    </Stack>
                    {discount > 0 && (
                      <Field.Description>
                        {money.format(discount)} off your order.
                      </Field.Description>
                    )}
                  </Field.Root>
                </StepSection>

                <StepSection hidden={step !== 1} title="Shipping address">
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
                    />
                    <TextField
                      name="address"
                      label="Street address"
                      autoComplete="street-address"
                      error={errors.address}
                    />
                    <TextField
                      name="city"
                      label="City"
                      autoComplete="address-level2"
                    />
                    <TextField
                      name="postcode"
                      label="Postcode"
                      autoComplete="postal-code"
                    />
                    <SelectField
                      name="country"
                      label="Country"
                      placeholder="Choose a country"
                      options={COUNTRIES}
                      defaultValue="gb"
                    />
                  </Grid>
                </StepSection>

                <StepSection hidden={step !== 2} title="Delivery">
                  <Stack gap={2}>
                    <Text id={speedLabel} register="label-sm" render={<span />}>
                      Delivery speed
                    </Text>
                    <RadioGroup
                      aria-labelledby={speedLabel}
                      value={speed}
                      onValueChange={(value) => setSpeed(String(value))}
                      className="grid gap-4"
                    >
                      {SPEEDS.map((item) => (
                        <ChoiceCard key={item.value}>
                          <Radio.Root value={item.value}>
                            <Radio.Indicator />
                          </Radio.Root>
                          <span className="flex flex-1 flex-col gap-1">
                            <span className="type-body-sm type-strong">
                              {item.name}
                            </span>
                            <span className="type-body-sm text-muted-foreground">
                              {item.when}
                            </span>
                          </span>
                          <span className="type-body-sm">
                            {item.price === 0
                              ? 'Free'
                              : money.format(item.price)}
                          </span>
                        </ChoiceCard>
                      ))}
                    </RadioGroup>
                  </Stack>
                  <Text
                    register="body-sm"
                    render={<label />}
                    className="flex items-center gap-2"
                  >
                    <Checkbox.Root name="gift">
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                    This is a gift; leave the prices off the packing slip
                  </Text>
                </StepSection>

                <StepSection hidden={step !== 3} title="Payment">
                  <Grid columns={{ minWidth: 200 }} gap={4}>
                    <TextField
                      name="cardName"
                      label="Name on card"
                      autoComplete="cc-name"
                    />
                    <TextField
                      name="card"
                      label="Card number"
                      autoComplete="cc-number"
                      error={errors.card}
                    />
                    <TextField
                      name="expiry"
                      label="Expiry"
                      autoComplete="cc-exp"
                      placeholder="MM / YY"
                    />
                    <TextField
                      name="cvc"
                      label="Security code"
                      autoComplete="cc-csc"
                    />
                  </Grid>
                </StepSection>

                <Stack direction="row" justify="end" gap={2}>
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
                    {step === STEPS.length - 1
                      ? `Pay ${money.format(total)}`
                      : `Continue to ${STEPS[step + 1]?.toLowerCase()}`}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Stack>

          {wide && (
            <Card.Root className="sticky top-8">
              <Card.Body className="gap-4">
                <Heading level={2} register="heading-4">
                  Order summary
                </Heading>
                {summary}
              </Card.Body>
            </Card.Root>
          )}
        </div>
      </Stack>
    </Layout>
  );
}
