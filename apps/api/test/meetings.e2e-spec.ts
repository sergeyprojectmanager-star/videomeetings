import { randomUUID } from 'node:crypto';
import { PasswordHasher } from '@nestjs/authentication';
import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { signHs256Jwt, verifyHs256Jwt } from './helpers/jwt.js';

/**
 * End-to-end tests for the meetings module (written first, TDD: they must be red
 * until the module exists).
 *
 * Contract these tests pin down. Every route requires `Authorization: Bearer <token>`,
 * where the token is the `accessToken` from `POST /auth/register`. A missing, malformed,
 * forged (wrong secret) or expired token gets 401.
 *
 * - `POST /meetings` `{ title, date, participants }` -> 201 with the created meeting
 *   `{ id, title, date, participants }`. The meeting belongs to the authenticated user.
 *   - `title`: non-empty string (not blank).
 *   - `date`: ISO 8601 date-time string; returned as the same instant in ISO form.
 *   - `participants`: array of e-mail strings; required, may be empty.
 *   - invalid body -> 400 and nothing is created.
 * - `GET /meetings` -> 200 with an array of the authenticated user's meetings (and only
 *   theirs); an empty array when there are none. The order is not part of the contract.
 * - `GET /meetings/:id` -> 200 with the meeting; 404 when no such meeting exists. A meeting
 *   of another user is also 404 (its existence is not revealed), as is an `id` that is
 *   not a UUID.
 * - Deleting a user deletes their meetings (cascade), which is how these tests clean up.
 *
 * The tests run against the real database (`docker compose up -d`, migrations applied).
 * Every user's e-mail is unique per test and matches `e2e-*@example.test`.
 */

// Provided by vitest.config.e2e.ts.
const JWT_SECRET = process.env.JWT_SECRET as string;
const PASSWORD = 'correct horse battery staple';
const E2E_EMAIL_PATTERN = 'e2e-%@example.test';

const uniqueEmail = () => `e2e-${randomUUID()}@example.test`;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface MeetingBody {
  id: string;
  title: string;
  date: string;
  participants: string[];
}

interface TestUser {
  id: string;
  token: string;
}

describe('Meetings (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;

  const http = () => request(app.getHttpServer());

  async function createUser(): Promise<TestUser> {
    const response = await http()
      .post('/auth/register')
      .send({ email: uniqueEmail(), password: PASSWORD })
      .expect(201);
    const token = response.body.accessToken as string;
    return { id: verifyHs256Jwt(token, JWT_SECRET).sub as string, token };
  }

  const bearer = (token: string) => `Bearer ${token}`;

  const createMeeting = (token: string, body: Record<string, unknown>) =>
    http().post('/meetings').set('Authorization', bearer(token)).send(body);
  const listMeetings = (token: string) =>
    http().get('/meetings').set('Authorization', bearer(token));
  const getMeeting = (token: string, id: string) =>
    http().get(`/meetings/${id}`).set('Authorization', bearer(token));

  const validBody = (overrides: Record<string, unknown> = {}) => ({
    title: 'Weekly sync',
    date: '2030-01-15T10:00:00.000Z',
    participants: ['alice@example.test', 'bob@example.test'],
    ...overrides,
  });

  /** Creates a meeting that must succeed and returns it. */
  async function givenMeeting(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<MeetingBody> {
    const response = await createMeeting(token, validBody(overrides)).expect(
      201,
    );
    return response.body as MeetingBody;
  }

  async function countMeetings(token: string): Promise<number> {
    const response = await listMeetings(token).expect(200);
    return (response.body as MeetingBody[]).length;
  }

  beforeAll(async () => {
    // scrypt is slow on purpose, so the tests use a much cheaper setting.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();

    pool = new Pool({
      connectionString: app.get(ConfigService).getOrThrow('DATABASE_URL'),
    });
  });

  afterAll(async () => {
    try {
      await pool.query('delete from users where email like $1', [
        E2E_EMAIL_PATTERN,
      ]);
    } finally {
      await pool.end();
      await app.close();
    }
  });

  describe('authentication', () => {
    const someId = randomUUID();
    const routes: [string, (authorization?: string) => request.Test][] = [
      [
        'POST /meetings',
        (authorization) => {
          const req = http().post('/meetings').send(validBody());
          return authorization ? req.set('Authorization', authorization) : req;
        },
      ],
      [
        'GET /meetings',
        (authorization) => {
          const req = http().get('/meetings');
          return authorization ? req.set('Authorization', authorization) : req;
        },
      ],
      [
        'GET /meetings/:id',
        (authorization) => {
          const req = http().get(`/meetings/${someId}`);
          return authorization ? req.set('Authorization', authorization) : req;
        },
      ],
    ];

    describe.each(routes)('%s', (_route, call) => {
      it('answers 401 without a token', async () => {
        await call().expect(401);
      });

      it('answers 401 for a malformed token', async () => {
        await call(bearer('not-a-jwt')).expect(401);
      });

      it('answers 401 for a token that is not a Bearer one', async () => {
        const { token } = await createUser();

        await call(token).expect(401);
      });

      it('answers 401 for a token signed with another secret', async () => {
        const { id } = await createUser();
        const exp = Math.floor(Date.now() / 1000) + 3600;
        const forged = signHs256Jwt({ sub: id, exp }, 'some-other-secret');

        await call(bearer(forged)).expect(401);
      });

      it('answers 401 for an expired token', async () => {
        const { id } = await createUser();
        const exp = Math.floor(Date.now() / 1000) - 60;
        const expired = signHs256Jwt({ sub: id, exp }, JWT_SECRET);

        await call(bearer(expired)).expect(401);
      });
    });
  });

  describe('POST /meetings', () => {
    let user: TestUser;

    beforeAll(async () => {
      user = await createUser();
    });

    it('creates a meeting and returns it', async () => {
      const body = validBody();

      const response = await createMeeting(user.token, body).expect(201);

      expect(response.body.id).toMatch(UUID_PATTERN);
      expect(response.body).toMatchObject({
        title: body.title,
        date: body.date,
        participants: body.participants,
      });
    });

    it('persists the meeting: it can be fetched afterwards', async () => {
      const created = await givenMeeting(user.token, { title: 'Persisted' });

      const fetched = await getMeeting(user.token, created.id).expect(200);

      expect(fetched.body).toMatchObject(created);
    });

    it('appears in the creator’s list', async () => {
      const created = await givenMeeting(user.token, { title: 'Listed' });

      const response = await listMeetings(user.token).expect(200);

      expect(response.body).toContainEqual(
        expect.objectContaining({ id: created.id, title: 'Listed' }),
      );
    });

    it('gives every meeting its own id', async () => {
      const first = await givenMeeting(user.token);
      const second = await givenMeeting(user.token);

      expect(first.id).not.toBe(second.id);
    });

    it('accepts an empty list of participants', async () => {
      const created = await givenMeeting(user.token, { participants: [] });

      expect(created.participants).toEqual([]);
    });

    it('returns the date as the same instant in ISO 8601 form', async () => {
      const created = await givenMeeting(user.token, {
        date: '2030-06-01T12:30:00+02:00',
      });

      expect(new Date(created.date).toISOString()).toBe(
        '2030-06-01T10:30:00.000Z',
      );
    });

    it('belongs to the authenticated user, not to whoever the body names', async () => {
      const other = await createUser();

      const created = await givenMeeting(user.token, {
        title: 'Mine',
        ownerId: other.id,
        userId: other.id,
      });

      await getMeeting(user.token, created.id).expect(200);
      await getMeeting(other.token, created.id).expect(404);
    });

    describe('validation', () => {
      it.each([
        ['an empty body', {}],
        ['a missing title', validBody({ title: undefined })],
        ['an empty title', validBody({ title: '' })],
        ['a blank title', validBody({ title: '   ' })],
        ['a non-string title', validBody({ title: 123 })],
        ['a missing date', validBody({ date: undefined })],
        ['a date that is not a date', validBody({ date: 'not-a-date' })],
        ['a non-string date', validBody({ date: 1893495600000 })],
        ['an empty date', validBody({ date: '' })],
        ['missing participants', validBody({ participants: undefined })],
        [
          'participants that are not an array',
          validBody({ participants: 'alice' }),
        ],
        [
          'a non-string participant',
          validBody({ participants: ['alice@example.test', 42] }),
        ],
        [
          'a participant that is not an e-mail',
          validBody({ participants: ['alice@example.test', 'not-an-email'] }),
        ],
      ])('answers 400 for %s and creates no meeting', async (_name, body) => {
        const before = await countMeetings(user.token);

        await createMeeting(user.token, body).expect(400);

        expect(await countMeetings(user.token)).toBe(before);
      });
    });
  });

  describe('GET /meetings', () => {
    it('returns an empty array for a user without meetings', async () => {
      const user = await createUser();

      const response = await listMeetings(user.token).expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns all meetings of the current user', async () => {
      const user = await createUser();
      const first = await givenMeeting(user.token, { title: 'First' });
      const second = await givenMeeting(user.token, {
        title: 'Second',
        date: '2031-02-03T04:05:06.000Z',
        participants: [],
      });

      const response = await listMeetings(user.token).expect(200);

      const meetings = response.body as MeetingBody[];
      expect(meetings).toHaveLength(2);
      expect(meetings).toEqual(
        expect.arrayContaining([
          expect.objectContaining(first),
          expect.objectContaining(second),
        ]),
      );
    });

    it('does not include meetings of other users', async () => {
      const alice = await createUser();
      const bob = await createUser();
      const aliceMeeting = await givenMeeting(alice.token, { title: 'Alice' });
      const bobMeeting = await givenMeeting(bob.token, { title: 'Bob' });

      const aliceList = (await listMeetings(alice.token).expect(200))
        .body as MeetingBody[];
      const bobList = (await listMeetings(bob.token).expect(200))
        .body as MeetingBody[];

      expect(aliceList.map((meeting) => meeting.id)).toEqual([aliceMeeting.id]);
      expect(bobList.map((meeting) => meeting.id)).toEqual([bobMeeting.id]);
    });

    it('does not include meetings where the user is only listed as a participant', async () => {
      const organizer = await createUser();
      const invitee = await createUser();
      const inviteeEmail = (
        await pool.query<{ email: string }>(
          'select email from users where id = $1',
          [invitee.id],
        )
      ).rows[0].email;
      await givenMeeting(organizer.token, { participants: [inviteeEmail] });

      const response = await listMeetings(invitee.token).expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('GET /meetings/:id', () => {
    it('returns the meeting', async () => {
      const user = await createUser();
      const created = await givenMeeting(user.token, {
        title: 'Design review',
        date: '2032-12-31T23:59:00.000Z',
        participants: ['carol@example.test'],
      });

      const response = await getMeeting(user.token, created.id).expect(200);

      expect(response.body).toMatchObject({
        id: created.id,
        title: 'Design review',
        date: '2032-12-31T23:59:00.000Z',
        participants: ['carol@example.test'],
      });
    });

    it('answers 404 when the meeting does not exist', async () => {
      const user = await createUser();
      // Guards against a false green: the route must exist (a missing route is a 404 too).
      const existing = await givenMeeting(user.token);
      await getMeeting(user.token, existing.id).expect(200);

      await getMeeting(user.token, randomUUID()).expect(404);
    });

    it('answers 404 for an id that is not a UUID', async () => {
      const user = await createUser();
      const existing = await givenMeeting(user.token);
      await getMeeting(user.token, existing.id).expect(200);

      await getMeeting(user.token, 'not-a-uuid').expect(404);
    });

    it('answers 404 for a meeting of another user, as if it did not exist', async () => {
      const owner = await createUser();
      const stranger = await createUser();
      const created = await givenMeeting(owner.token);

      const response = await getMeeting(stranger.token, created.id).expect(404);

      expect(JSON.stringify(response.body)).not.toContain(created.title);
      await getMeeting(owner.token, created.id).expect(200);
    });
  });
});
