'use client';

import { useActionState } from 'react';
import { CircleCheck, Envelope } from '@gravity-ui/icons';
import {
  Button,
  FieldError,
  Form,
  InputGroup,
  Label,
  Spinner,
  TextField,
} from '@heroui/react';
import { FormErrorAlert } from '@/components/form-error-alert';
import { PasswordField } from '@/components/password-field';
import { register, type RegisterState } from './actions';

const initialState: RegisterState = { status: 'idle' };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);

  if (state.status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CircleCheck className="size-8" />
        </span>
        <h2 className="text-xl font-semibold">You&apos;re all set!</h2>
        <p className="text-sm text-muted">
          Your account{' '}
          <span className="font-medium text-foreground">{state.email}</span> has
          been created and you are signed in.
        </p>
      </div>
    );
  }

  const fieldErrors = state.status === 'error' ? state.fieldErrors : undefined;
  const message = state.status === 'error' ? state.message : undefined;

  return (
    <Form
      action={formAction}
      className="flex flex-col gap-5"
      validationErrors={{
        ...(fieldErrors?.email ? { email: fieldErrors.email } : {}),
        ...(fieldErrors?.password ? { password: fieldErrors.password } : {}),
      }}
    >
      {message ? <FormErrorAlert message={message} /> : null}

      <TextField
        isRequired
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.status === 'error' ? state.email : ''}
        isDisabled={isPending}
      >
        <Label>Email</Label>
        <InputGroup>
          <InputGroup.Prefix>
            <Envelope className="size-4 text-muted" />
          </InputGroup.Prefix>
          <InputGroup.Input placeholder="you@example.com" />
        </InputGroup>
        <FieldError />
      </TextField>

      <PasswordField
        autoComplete="new-password"
        placeholder="At least 8 characters"
        description="Use 8 to 128 characters."
        minLength={8}
        maxLength={128}
        isDisabled={isPending}
      />

      <Button type="submit" fullWidth isPending={isPending}>
        {({ isPending }) => (
          <>
            {isPending ? <Spinner color="current" size="sm" /> : null}
            {isPending ? 'Creating account…' : 'Create account'}
          </>
        )}
      </Button>
    </Form>
  );
}
