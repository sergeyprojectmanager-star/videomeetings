import { AppHeader } from '@/components/app-header';
import {
  AllMeetings,
  EmptyMeetings,
  LatestMeetings,
} from '@/components/meetings';
import { getDashboardData } from '@/lib/dashboard-data';

/**
 * The signed-in home page: who is signed in plus their meetings. It reads the
 * session, so `page.tsx` renders it behind a `<Suspense>` boundary.
 */
export async function Dashboard() {
  const { user, meetings, latest } = await getDashboardData();

  return (
    <>
      <AppHeader email={user.email} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your meetings
          </h1>
          <p className="mt-1 text-sm text-muted">
            {meetings.length === 0
              ? 'Nothing scheduled yet.'
              : `${meetings.length} in total, newest first.`}
          </p>
        </div>

        {meetings.length === 0 ? (
          <EmptyMeetings />
        ) : (
          <>
            <section aria-labelledby="latest-meetings" className="space-y-4">
              <div>
                <h2 id="latest-meetings" className="text-lg font-semibold">
                  Latest meetings
                </h2>
                <p className="text-sm text-muted">
                  {latest.length === 1
                    ? 'Your only meeting.'
                    : `Your ${latest.length} most recent meetings, by date.`}
                </p>
              </div>
              <LatestMeetings meetings={latest} />
            </section>

            <section aria-labelledby="all-meetings" className="space-y-4">
              <h2 id="all-meetings" className="text-lg font-semibold">
                All meetings
              </h2>
              <AllMeetings meetings={meetings} />
            </section>
          </>
        )}
      </main>
    </>
  );
}
