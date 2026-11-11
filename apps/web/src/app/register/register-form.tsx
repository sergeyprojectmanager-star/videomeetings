'use client';

import { useActionState } from 'react';
import { Button, Form, Spinner } from '@heroui/react';
import { EmailField } from '@/components/email-field';
import { FormErrorAlert } from '@/components/form-error-alert';
import { PasswordField } from '@/components/password-field';
import { useFieldErrors } from '@/components/use-field-errors';
import { useFormFocus } from '@/components/use-form-focus';
import { validateEmail, validateNewPassword } from '@/lib/validation';
import { register, type RegisterState } from './actions';

const initialState: RegisterState = { status: 'idle' };

// Mirrors the api: a password is 8 to 128 characters (the cap is `maxLength`).
const PASSWORD_MIN_LENGTH = 8;
const validators = {
  email: validateEmail,
  password: validateNewPassword(PASSWORD_MIN_LENGTH),
};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);
  const { formRef, alertRef } = useFormFocus(state);
  const { fieldProps, validateForm } = useFieldErrors(validators);

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
      validationErrors={{
        ...(fieldErrors?.email ? { email: fieldErrors.email } : {}),
        ...(fieldErrors?.password ? { password: fieldErrors.password } : {}),
      }}
    >
      {message ? <FormErrorAlert ref={alertRef} message={message} /> : null}

      <EmailField
        defaultValue={state.status === 'error' ? state.email : ''}
        isReadOnly={isPending}
        {...fieldProps('email')}
      />

      <PasswordField
        autoComplete="new-password"
        placeholder="At least 8 characters"
        description="Use 8 to 128 characters."
        maxLength={128}
        isReadOnly={isPending}
        {...fieldProps('password')}
      />

      <Button type="submit" size="lg" fullWidth isPending={isPending}>
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
