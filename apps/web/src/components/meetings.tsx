import { Calendar, Persons } from '@gravity-ui/icons';
import { Card, Chip } from '@heroui/react';
import type { MeetingView } from '@/lib/dashboard-data';
import { MeetingDate } from './meeting-date';

function participantsLabel(count: number): string {
  if (count === 0) return 'No participants';
  return count === 1 ? '1 participant' : `${count} participants`;
}

function StatusChip({ isUpcoming }: { isUpcoming: boolean }) {
  return (
    <Chip size="sm" variant="soft" color={isUpcoming ? 'accent' : 'default'}>
      {isUpcoming ? 'Upcoming' : 'Past'}
    </Chip>
  );
}

/** The most recent meetings as cards. */
export function LatestMeetings({ meetings }: { meetings: MeetingView[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meetings.map((meeting) => (
        <li key={meeting.id} className="flex">
          <Card className="w-full gap-3 p-5 shadow-md">
            <Card.Header className="flex-row items-start justify-between gap-3">
              <Card.Title className="text-base font-semibold break-words">
                {meeting.title}
              </Card.Title>
              <StatusChip isUpcoming={meeting.isUpcoming} />
            </Card.Header>
            <Card.Content className="flex flex-col gap-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <Calendar aria-hidden="true" className="size-4 shrink-0" />
                <MeetingDate iso={meeting.date} />
              </p>
              <p className="flex items-center gap-2">
                <Persons aria-hidden="true" className="size-4 shrink-0" />
                {participantsLabel(meeting.participants.length)}
              </p>
            </Card.Content>
          </Card>
        </li>
      ))}
    </ul>
  );
}

/** Every meeting as a compact list. */
export function AllMeetings({ meetings }: { meetings: MeetingView[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {meetings.map((meeting) => (
        <li
          key={meeting.id}
          className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
        >
          <div className="min-w-0">
            <p className="font-medium break-words">{meeting.title}</p>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
              <Calendar aria-hidden="true" className="size-4 shrink-0" />
              <MeetingDate iso={meeting.date} />
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-3 text-sm text-muted sm:justify-end">
            <span className="flex items-center gap-2">
              <Persons aria-hidden="true" className="size-4 shrink-0" />
              {participantsLabel(meeting.participants.length)}
            </span>
            <StatusChip isUpcoming={meeting.isUpcoming} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Shown instead of the lists when the user has no meetings yet. */
export function EmptyMeetings() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent"
      >
        <Calendar className="size-7" />
      </span>
      <h2 className="text-lg font-semibold">No meetings yet</h2>
      <p className="max-w-sm text-sm text-muted">
        Meetings you create will show up here, with the three most recent ones
        highlighted at the top.
      </p>
    </div>
  );
}
