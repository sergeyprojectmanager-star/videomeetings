'use client';

import { useState } from 'react';
import { Eye, EyeSlash, Lock } from '@gravity-ui/icons';
import {
  Button,
  Description,
  FieldError,
  InputGroup,
  Label,
  TextField,
} from '@heroui/react';

type PasswordFieldProps = {
  autoComplete: 'new-password' | 'current-password';
  placeholder: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  isDisabled?: boolean;
};

/** Required `password` field with a show/hide toggle. */
export function PasswordField({
  autoComplete,
  placeholder,
  description,
  minLength,
  maxLength,
  isDisabled,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField
      isRequired
      name="password"
      type={isVisible ? 'text' : 'password'}
      autoComplete={autoComplete}
      minLength={minLength}
      maxLength={maxLength}
      isDisabled={isDisabled}
    >
      <Label>Password</Label>
      <InputGroup>
        <InputGroup.Prefix>
          <Lock className="size-4 text-muted" />
        </InputGroup.Prefix>
        <InputGroup.Input placeholder={placeholder} />
        <InputGroup.Suffix className="pr-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            onPress={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? <EyeSlash /> : <Eye />}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {description ? <Description>{description}</Description> : null}
      <FieldError />
    </TextField>
  );
}
