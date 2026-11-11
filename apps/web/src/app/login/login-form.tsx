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
import { login, type LoginState } from './actions';

const initialState: LoginState = { status: 'idle' };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  if (state.status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CircleCheck className="size-8" />
        </span>
        <h2 className="text-xl font-semibold">You&apos;re signed in</h2>
        <p className="text-sm text-muted">
          Signed in as{' '}
          <span className="font-medium text-foreground">{state.email}</span>.
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
      validationErrors={fieldErrors?.email ? { email: fieldErrors.email } : {}}
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
        autoComplete="current-password"
        placeholder="Your password"
        isDisabled={isPending}
      />

      <Button type="submit" fullWidth isPending={isPending}>
        {({ isPending }) => (
          <>
            {isPending ? <Spinner color="current" size="sm" /> : null}
            {isPending ? 'Signing in…' : 'Sign in'}
          </>
        )}
      </Button>
    </Form>
  );
}
