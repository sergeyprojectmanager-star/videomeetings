'use client';

import { useState, type FocusEvent } from 'react';
import type { Validator } from '@/lib/validation';

/**
 * Client-side validation for a form, with our own messages instead of the
 * browser's:
 * - on blur a non-empty field is checked (an empty one stays quiet),
 * - once a field shows an error it is re-checked on every change, so the error
 *   disappears the moment the value is valid,
 * - `validateForm` checks every field on submit and focuses the first invalid.
 *
 * Use it with `<Form validationBehavior="aria">` so the browser does not show
 * its own bubbles. Server errors still go through the form's
 * `validationErrors`.
 */
export function useFieldErrors<K extends string>(
  validators: Record<K, Validator>,
) {
  const [errors, setErrors] = useState<Partial<Record<K, string>>>({});

  const setError = (name: K, message: string | null) =>
    setErrors((previous) => ({ ...previous, [name]: message ?? undefined }));

  const fieldProps = (name: K) => ({
    error: errors[name],
    onBlur: (event: FocusEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setError(name, value === '' ? null : validators[name](value));
    },
    onChange: (value: string) => {
      if (errors[name]) setError(name, validators[name](value));
    },
  });

  /** Returns true when every field is valid; otherwise shows all errors. */
  const validateForm = (form: HTMLFormElement): boolean => {
    const data = new FormData(form);
    const next: Partial<Record<K, string>> = {};
    let firstInvalid: K | null = null;

    for (const name of Object.keys(validators) as K[]) {
      const message = validators[name](String(data.get(name) ?? ''));
      if (message) {
        next[name] = message;
        firstInvalid ??= name;
      }
    }

    setErrors(next);
    if (firstInvalid) {
      form.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
    }
    return firstInvalid === null;
  };

  return { fieldProps, validateForm };
}
