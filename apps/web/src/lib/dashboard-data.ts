import { getCurrentUser, getMeetings, type Meeting } from './dal';

/** How many meetings the "Latest meetings" block shows. */
export const LATEST_COUNT = 3;

/** A meeting plus whether it is still ahead of us. */
export interface MeetingView extends Meeting {
  isUpcoming: boolean;
}

/**
 * Everything the home page shows. Meetings come newest first by their date
 * (the api returns the oldest first), and `latest` is the first few of them.
 */
export async function getDashboardData() {
  const [user, meetings] = await Promise.all([getCurrentUser(), getMeetings()]);

  const now = Date.now();
  const newestFirst: MeetingView[] = meetings
    .map((meeting) => ({
      ...meeting,
      isUpcoming: new Date(meeting.date).getTime() > now,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    user,
    meetings: newestFirst,
    latest: newestFirst.slice(0, LATEST_COUNT),
  };
}
