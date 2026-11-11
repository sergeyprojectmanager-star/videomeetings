'use client';

import { useEffect, useRef } from 'react';

type FormState =
  | { status: 'idle' }
  | {
      status: 'error';
      message?: string;
      fieldErrors?: Partial<Record<string, string>>;
    };

/**
 * After a failed submit, moves focus to the first invalid field or, when the
 * error is not tied to a field, to the form-level alert. Without it, focus is
 * left on <body> and keyboard and screen reader users do not hear the outcome.
 * (A successful submit redirects, so there is nothing to focus.)
 */
export function useFormFocus(state: FormState) {
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== 'error') return;

    const invalidField = Object.keys(state.fieldErrors ?? {}).find(
      (name) => state.fieldErrors?.[name],
    );
    if (invalidField) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${invalidField}"]`)
        ?.focus();
    } else {
      alertRef.current?.focus();
    }
  }, [state]);

  return { formRef, alertRef };
}
