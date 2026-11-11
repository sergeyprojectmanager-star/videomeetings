import type { ReactNode } from 'react';
import { Card } from '@heroui/react';
import { Brand } from './brand';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  /** Secondary content below the card, e.g. a link to the other auth page. */
  footer?: ReactNode;
};

/** Shared layout of the auth pages: branded background, logo and a card. */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-12">
      {/* The blobs overflow on purpose. They live in their own clipped layer:
          clipping <main> instead lets focus() scroll it and shift the card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -left-32 size-[28rem] rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -right-32 -bottom-40 size-[30rem] rounded-full bg-success/20 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center gap-6">
        <Brand />

        <Card className="w-full gap-6 p-6 shadow-xl sm:p-8">
          <Card.Header className="gap-1">
            {/* The page's only h1; Card.Title would render an h3. */}
            <h1 className="text-2xl font-semibold">{title}</h1>
            <Card.Description>{description}</Card.Description>
          </Card.Header>
          <Card.Content>{children}</Card.Content>
        </Card>

        {footer ? <p className="text-sm text-muted">{footer}</p> : null}
      </div>
    </main>
  );
}
