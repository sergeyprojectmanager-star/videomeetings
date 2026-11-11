'use client';

import { useSyncExternalStore } from 'react';

function format(iso: string, timeZone: string | undefined): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso));
}

// Nothing to subscribe to: the store only exists to pick the snapshot.
const subscribe = () => () => {};

/**
 * A date and time in the viewer's time zone. The server does not know that
 * zone, so it renders UTC (labelled) and the browser swaps in the local time
 * on hydration, without a hydration mismatch.
 */
export function MeetingDate({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribe,
    () => format(iso, undefined),
    () => `${format(iso, 'UTC')} UTC`,
  );
  return <time dateTime={iso}>{text}</time>;
}
