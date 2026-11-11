import { Button } from '@heroui/react';
import { logout } from '@/app/actions';
import { Brand } from './brand';

/** Top bar of the signed-in pages: the app name, who is signed in and Sign out. */
export function AppHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Brand collapseOnMobile />
        <div className="flex min-w-0 items-center gap-3">
          <p className="min-w-0 text-right leading-tight">
            <span className="block text-xs text-muted">Signed in as</span>
            <span
              className="block max-w-[11rem] truncate text-sm font-medium sm:max-w-xs"
              title={email}
            >
              {email}
            </span>
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
