import type { Ref } from 'react';
import { TriangleExclamation } from '@gravity-ui/icons';
import { Alert } from '@heroui/react';

type FormErrorAlertProps = {
  message: string;
  /** Lets the form move focus here so the error is read out after a submit. */
  ref?: Ref<HTMLDivElement>;
};

/** Form-level error that does not belong to a single field. */
export function FormErrorAlert({ message, ref }: FormErrorAlertProps) {
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Alert status="danger">
        <Alert.Indicator>
          <TriangleExclamation />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title>{message}</Alert.Title>
        </Alert.Content>
      </Alert>
    </div>
  );
}
