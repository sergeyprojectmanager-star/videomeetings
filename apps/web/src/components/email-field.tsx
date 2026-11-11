'use client';

import type { FocusEvent } from 'react';
import { Envelope } from '@gravity-ui/icons';
import { FieldError, InputGroup, Label, TextField } from '@heroui/react';
import { inputGroupClassName } from './field-styles';

type EmailFieldProps = {
  defaultValue?: string;
  /** Client-side error from `useFieldErrors`; server errors arrive via Form. */
  error?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (value: string) => void;
  /** Keeps focus in the field while a submit is in flight (unlike disabled). */
  isReadOnly?: boolean;
};

/** Required `email` field; validation is driven by the parent form. */
export function EmailField({
  defaultValue,
  error,
  onBlur,
  onChange,
  isReadOnly,
}: EmailFieldProps) {
  return (
    <TextField
      isRequired
      name="email"
      type="email"
      autoComplete="email"
      defaultValue={defaultValue}
      isReadOnly={isReadOnly}
      isInvalid={error ? true : undefined}
      onBlur={onBlur}
      onChange={onChange}
    >
      <Label>Email</Label>
      <InputGroup className={inputGroupClassName}>
        <InputGroup.Prefix>
          <Envelope className="size-4 text-muted" />
        </InputGroup.Prefix>
        <InputGroup.Input
          placeholder="you@example.com"
          autoCapitalize="none"
          spellCheck={false}
        />
      </InputGroup>
      <FieldError className="text-sm">{error}</FieldError>
    </TextField>
  );
}
