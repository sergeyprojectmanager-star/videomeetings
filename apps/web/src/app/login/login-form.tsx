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
import { inputGroupClassName } from '@/components/field-styles';
import { FormErrorAlert } from '@/components/form-error-alert';
import { PasswordField } from '@/components/password-field';
import { useFormFocus } from '@/components/use-form-focus';
import { login, type LoginState } from './actions';

const initialState: LoginState = { status: 'idle' };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const { formRef, alertRef, successRef } = useFormFocus(state);

  if (state.status === 'success') {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="flex flex-col items-center gap-3 py-4 text-center outline-none"
      >
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success"
        >
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
      ref={formRef}
      action={formAction}
      // A second submit while one is in flight (e.g. Enter in a read-only
      // field) would queue a duplicate request.
      onSubmit={(event) => {
        if (isPending) event.preventDefault();
      }}
      className="flex flex-col gap-5"
      validationErrors={fieldErrors?.email ? { email: fieldErrors.email } : {}}
    >
      {message ? <FormErrorAlert ref={alertRef} message={message} /> : null}

      <TextField
        isRequired
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.status === 'error' ? state.email : ''}
        isReadOnly={isPending}
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
        <FieldError />
      </TextField>

      <PasswordField
        autoComplete="current-password"
        placeholder="Your password"
        isReadOnly={isPending}
      />

      <Button type="submit" size="lg" fullWidth isPending={isPending}>
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
