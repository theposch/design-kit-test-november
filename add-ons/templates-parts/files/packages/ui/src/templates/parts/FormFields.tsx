import type { ReactNode } from 'react';

import * as Field from '#components/atoms/Field';
import { Input } from '#components/atoms/Input';
import * as Select from '#components/atoms/Select';

export type Option = { value: string; label: string };

/* A labelled text input with an optional hint and error, for demo forms. */
export function TextField({
  name,
  label,
  description,
  error,
  ...input
}: {
  name: string;
  label: string;
  description?: ReactNode;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <Field.Root name={name} invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Input name={name} {...input} />
      {description && <Field.Description>{description}</Field.Description>}
      {error && <Field.Error match>{error}</Field.Error>}
    </Field.Root>
  );
}

/* A labelled single-choice dropdown, for demo forms. */
export function SelectField({
  name,
  label,
  placeholder,
  options,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: Option[];
  defaultValue?: string;
  error?: string;
}) {
  return (
    <Field.Root name={name} invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Select.Root name={name} items={options} defaultValue={defaultValue}>
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
