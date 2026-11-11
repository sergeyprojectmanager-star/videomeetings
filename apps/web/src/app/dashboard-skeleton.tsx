import { Skeleton } from '@heroui/react';
import { Brand } from '@/components/brand';

/** Placeholder while the session and the meetings load. */
export function DashboardSkeleton() {
  return (
    <>
      <header className="border-b border-border bg-surface/80">
        <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Brand collapseOnMobile />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
      </header>
      <main
        aria-busy="true"
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10"
      >
        <p className="sr-only" role="status">
          Loading your meetings…
        </p>
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="hidden h-32 rounded-2xl lg:block" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </main>
    </>
  );
}
