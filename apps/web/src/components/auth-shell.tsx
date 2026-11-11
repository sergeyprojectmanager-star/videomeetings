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

      <div className="group/shell relative flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30"
          >
            <Video className="size-6" />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            Video meetings
          </span>
        </div>

        <Card className="w-full gap-6 p-6 shadow-xl sm:p-8">
          {/* Once a form shows its success panel (`data-auth-success`), the
              panel takes over: the invitation to sign up or in is hidden. */}
          <Card.Header className="gap-1 group-has-[[data-auth-success]]/shell:hidden">
            {/* The page's only h1; Card.Title would render an h3. */}
            <h1 className="text-2xl font-semibold">{title}</h1>
            <Card.Description>{description}</Card.Description>
          </Card.Header>
          <Card.Content>{children}</Card.Content>
        </Card>

        {footer ? (
          <p className="text-sm text-muted group-has-[[data-auth-success]]/shell:hidden">
            {footer}
          </p>
        ) : null}
      </div>
    </main>
  );
}
