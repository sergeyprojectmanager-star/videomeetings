import { NotFoundException } from '@nestjs/common';
import type { Meeting, MeetingsService } from '../meetings.service.js';
import { GetMeetingHandler } from './get-meeting.handler.js';
import { GetMeetingQuery } from './get-meeting.query.js';

const meeting: Meeting = {
  id: 'meeting-id',
  title: 'Weekly sync',
  date: new Date('2030-01-15T10:00:00Z'),
  participants: [],
};

describe('GetMeetingHandler', () => {
  const meetings = { findOwned: vi.fn<MeetingsService['findOwned']>() };
  const handler = new GetMeetingHandler(meetings as unknown as MeetingsService);

  beforeEach(() => vi.resetAllMocks());

  it('returns the meeting of the user', async () => {
    meetings.findOwned.mockResolvedValue(meeting);

    await expect(
      handler.execute(new GetMeetingQuery('owner-id', 'meeting-id')),
    ).resolves.toBe(meeting);
    expect(meetings.findOwned).toHaveBeenCalledWith('meeting-id', 'owner-id');
  });

  it('throws NotFoundException when there is no such meeting for the user', async () => {
    meetings.findOwned.mockResolvedValue(undefined);

    await expect(
      handler.execute(new GetMeetingQuery('owner-id', 'meeting-id')),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
