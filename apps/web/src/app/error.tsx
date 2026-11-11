'use client';

import { useEffect } from 'react';
import { Button } from '@heroui/react';
import { AuthShell } from '@/components/auth-shell';

/** Shown when a page fails to load, e.g. when the api is unreachable. */
export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AuthShell
      title="Something went wrong"
      description="We could not load this page. Check that the server is running and try again."
    >
      <Button fullWidth size="lg" onPress={() => retry()}>
        Try again
      </Button>
    </AuthShell>
  );
}
