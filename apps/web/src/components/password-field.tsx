'use client';

import { useState, type FocusEvent } from 'react';
import { Eye, EyeSlash, Lock } from '@gravity-ui/icons';
import {
  Button,
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from '@heroui/react';
import { inputGroupClassName } from './field-styles';

type PasswordFieldProps = {
  autoComplete: 'new-password' | 'current-password';
  placeholder: string;
  description?: string;
  maxLength?: number;
  /** Client-side error from `useFieldErrors`; server errors arrive via Form. */
  error?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (value: string) => void;
  /** Keeps focus in the field while a submit is in flight (unlike disabled). */
  isReadOnly?: boolean;
};

/** Required `password` field with a show/hide toggle; validation is driven by the parent form. */
export function PasswordField({
  autoComplete,
  placeholder,
  description,
  maxLength,
  error,
  onBlur,
  onChange,
  isReadOnly,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      isRequired
      name="password"
      type={isVisible ? 'text' : 'password'}
      autoComplete={autoComplete}
      maxLength={maxLength}
      isReadOnly={isReadOnly}
      isInvalid={error ? true : undefined}
      onBlur={onBlur}
      onChange={onChange}
    >
      <Label>Password</Label>
      <InputGroup className={inputGroupClassName}>
        <InputGroup.Prefix>
          <Lock className="size-4 text-muted" />
        </InputGroup.Prefix>
        <InputGroup.Input placeholder={placeholder} />
        <InputGroup.Suffix className="pr-1">
          <Button
            isIconOnly
            size="md"
            variant="ghost"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            onPress={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? <EyeSlash /> : <Eye />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {description ? <Description>{description}</Description> : null}
      <FieldError className="text-sm">{error}</FieldError>
    </TextField>
  );
}
