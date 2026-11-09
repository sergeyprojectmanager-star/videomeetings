import { createMeetingSchema } from './meetings.schemas.js';

const valid = {
  title: 'Weekly sync',
  date: '2030-01-15T10:00:00.000Z',
  participants: ['alice@example.test'],
};

describe('createMeetingSchema', () => {
  it('parses a valid body, turning the date into a Date', () => {
    const result = createMeetingSchema.safeParse(valid);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      ...valid,
      date: new Date('2030-01-15T10:00:00.000Z'),
    });
  });

  it('trims the title and normalizes participant e-mails', () => {
    const result = createMeetingSchema.parse({
      ...valid,
      title: '  Sync  ',
      participants: ['  Alice@Example.TEST '],
    });

    expect(result.title).toBe('Sync');
    expect(result.participants).toEqual(['alice@example.test']);
  });

  it('converts a date with an offset to the same instant', () => {
    const { date } = createMeetingSchema.parse({
      ...valid,
      date: '2030-06-01T12:30:00+02:00',
    });

    expect(date.toISOString()).toBe('2030-06-01T10:30:00.000Z');
  });

  it('accepts an empty list of participants', () => {
    expect(
      createMeetingSchema.safeParse({ ...valid, participants: [] }).success,
    ).toBe(true);
  });

  it.each([
    ['a missing title', { title: undefined }],
    ['a blank title', { title: '   ' }],
    ['a non-string title', { title: 1 }],
    ['a missing date', { date: undefined }],
    ['a date-only string', { date: '2030-01-15' }],
    ['a non-date string', { date: 'tomorrow' }],
    ['a numeric date', { date: 1893495600000 }],
    ['missing participants', { participants: undefined }],
    ['non-array participants', { participants: 'alice@example.test' }],
    ['an invalid participant e-mail', { participants: ['nope'] }],
  ])('rejects %s', (_name, overrides) => {
    expect(
      createMeetingSchema.safeParse({ ...valid, ...overrides }).success,
    ).toBe(false);
  });
});
