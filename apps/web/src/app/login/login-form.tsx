'use client';

import { useActionState } from 'react';
import { CircleCheck } from '@gravity-ui/icons';
import { Button, Form, Spinner } from '@heroui/react';
import { EmailField } from '@/components/email-field';
import { FormErrorAlert } from '@/components/form-error-alert';
import { PasswordField } from '@/components/password-field';
import { useFieldErrors } from '@/components/use-field-errors';
import { useFormFocus } from '@/components/use-form-focus';
import { validateCurrentPassword, validateEmail } from '@/lib/validation';
import { login, type LoginState } from './actions';

const initialState: LoginState = { status: 'idle' };

const validators = {
  email: validateEmail,
  password: validateCurrentPassword,
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const { formRef, alertRef, successRef } = useFormFocus(state);
  const { fieldProps, validateForm } = useFieldErrors(validators);

  if (state.status === 'success') {
    // `data-auth-success` makes AuthShell hide its own title, description and
    // footer link, so this panel is the only heading (the h1) in this state.
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        data-auth-success=""
        className="flex flex-col items-center gap-3 py-4 text-center outline-none"
      >
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <CircleCheck className="size-8" />
        </span>
        <h1 className="text-2xl font-semibold">You&apos;re signed in</h1>
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
      // Our own validation replaces the browser's bubbles (see useFieldErrors).
      validationBehavior="aria"
      // A second submit while one is in flight (e.g. Enter in a read-only
      // field) would queue a duplicate request.
      onSubmit={(event) => {
        if (isPending || !validateForm(event.currentTarget)) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-5"
      validationErrors={fieldErrors?.email ? { email: fieldErrors.email } : {}}
    >
      {message ? <FormErrorAlert ref={alertRef} message={message} /> : null}

      <EmailField
        defaultValue={state.status === 'error' ? state.email : ''}
        isReadOnly={isPending}
        {...fieldProps('email')}
      />

      <PasswordField
        autoComplete="current-password"
        placeholder="Your password"
        isReadOnly={isPending}
        {...fieldProps('password')}
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
