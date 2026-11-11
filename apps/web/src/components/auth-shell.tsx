import type { ReactNode } from 'react';
import { Video } from '@gravity-ui/icons';
import { Card } from '@heroui/react';

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
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full bg-accent/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -bottom-40 size-[30rem] rounded-full bg-success/20 blur-3xl"
      />

      <div className="relative flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
            <Video className="size-6" />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            Video meetings
          </span>
        </div>

        <Card className="w-full gap-6 p-6 shadow-xl sm:p-8">
          <Card.Header className="gap-1">
            <Card.Title className="text-2xl font-semibold">{title}</Card.Title>
            <Card.Description>{description}</Card.Description>
          </Card.Header>
          <Card.Content>{children}</Card.Content>
        </Card>

        {footer ? <p className="text-sm text-muted">{footer}</p> : null}
      </div>
    </main>
  );
}
