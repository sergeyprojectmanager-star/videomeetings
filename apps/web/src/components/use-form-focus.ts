'use client';

import { useEffect, useRef } from 'react';

type FormState =
  | { status: 'idle' }
  | { status: 'success' }
  | {
      status: 'error';
      message?: string;
      fieldErrors?: Partial<Record<string, string>>;
    };

/**
 * Moves focus to where the result of a submit is: the first invalid field,
 * the form-level alert or the success panel. Without it, focus is left on
 * <body> and keyboard and screen reader users do not hear the outcome.
 */
export function useFormFocus(state: FormState) {
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'success') {
      successRef.current?.focus();
      return;
    }
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

  return { formRef, alertRef, successRef };
}
