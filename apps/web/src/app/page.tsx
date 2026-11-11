import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Dashboard } from './dashboard';
import { DashboardSkeleton } from './dashboard-skeleton';

export const metadata: Metadata = {
  title: 'Your meetings · Video meetings',
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* The dashboard reads the session cookie, so it streams in behind a
          boundary (Cache Components) instead of blocking the page. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
