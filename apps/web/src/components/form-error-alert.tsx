import { TriangleExclamation } from '@gravity-ui/icons';
import { Alert } from '@heroui/react';

/** Form-level error that does not belong to a single field. */
export function FormErrorAlert({ message }: { message: string }) {
  return (
    <Alert status="danger">
      <Alert.Indicator>
        <TriangleExclamation />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>{message}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
}
