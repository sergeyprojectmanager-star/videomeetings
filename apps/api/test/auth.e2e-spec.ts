import { randomUUID } from 'node:crypto';
import { PasswordHasher } from '@nestjs/authentication';
import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { verifyHs256Jwt } from './helpers/jwt.js';

/**
 * End-to-end tests for registration and login (written first, TDD).
 *
 * Contract these tests pin down:
 *
 * - `POST /auth/register` `{ email, password }` -> 201 `{ accessToken }`; creates a user.
 * - `POST /auth/login`    `{ email, password }` -> 200 `{ accessToken }`; creates nothing,
 *   only looks the user up.
 * - `accessToken` is a JWT signed with HS256 using the `JWT_SECRET` setting; `sub` is the
 *   user's id and `exp` is in the future.
 * - Users live in the `users` table: `id`, `email` (stored trimmed and lower-cased,
 *   unique), `password_hash` (never the plain password).
 * - Passwords are 8-128 characters.
 * - Errors: 400 for an invalid body, 409 when registering a taken email, 401 for bad
 *   credentials (the same answer for an unknown email and a wrong password).
 *
 * The tests run against the real database (`docker compose up -d`) and clean up after
 * themselves: every e-mail is unique per test and matches `e2e-*@example.test`.
 */

// Provided by vitest.config.e2e.ts.
const JWT_SECRET = process.env.JWT_SECRET as string;
const PASSWORD = 'correct horse battery staple';
const E2E_EMAIL_PATTERN = 'e2e-%@example.test';

const uniqueEmail = () => `e2e-${randomUUID()}@example.test`;

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let pool: Pool;

  const http = () => request(app.getHttpServer());
  const register = (body: Record<string, unknown>) =>
    http().post('/auth/register').send(body);
  const login = (body: Record<string, unknown>) =>
    http().post('/auth/login').send(body);

  async function findUsers(email: string): Promise<UserRow[]> {
    const { rows } = await pool.query<UserRow>(
      'select id, email, password_hash from users where email = $1',
      [email],
    );
    return rows;
  }

  async function countUsers(): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      'select count(*) from users',
    );
    return Number(rows[0].count);
  }

  /** Asserts the token is a valid, unexpired JWT for the given user id. */
  function expectTokenFor(token: unknown, userId: string) {
    expect(typeof token).toBe('string');
    const payload = verifyHs256Jwt(token as string, JWT_SECRET);
    expect(payload.sub).toBe(userId);
  }

  beforeAll(async () => {
    // scrypt is slow on purpose (about 128 MiB and a few hundred ms per hash at the
    // default cost), so the tests use a much cheaper setting.
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

  describe('POST /auth/register', () => {
    it('creates a user and returns a JWT for it', async () => {
      const email = uniqueEmail();

      const response = await register({ email, password: PASSWORD }).expect(
        201,
      );

      const users = await findUsers(email);
      expect(users).toHaveLength(1);
      expectTokenFor(response.body.accessToken, users[0].id);
    });

    it('returns only the token, without the password or its hash', async () => {
      const response = await register({
        email: uniqueEmail(),
        password: PASSWORD,
      }).expect(201);

      expect(Object.keys(response.body)).toEqual(['accessToken']);
      expect(JSON.stringify(response.body)).not.toContain(PASSWORD);
    });

    it('stores a hash of the password, never the password itself', async () => {
      const email = uniqueEmail();

      await register({ email, password: PASSWORD }).expect(201);

      const [user] = await findUsers(email);
      expect(user.password_hash).toBeTruthy();
      expect(user.password_hash).not.toBe(PASSWORD);
      expect(user.password_hash).not.toContain(PASSWORD);
    });

    it('salts hashes: the same password gives different hashes for different users', async () => {
      const first = uniqueEmail();
      const second = uniqueEmail();

      await register({ email: first, password: PASSWORD }).expect(201);
      await register({ email: second, password: PASSWORD }).expect(201);

      const [firstUser] = await findUsers(first);
      const [secondUser] = await findUsers(second);
      expect(firstUser.password_hash).not.toBe(secondUser.password_hash);
    });

    it('stores the e-mail trimmed and lower-cased', async () => {
      const email = uniqueEmail();

      await register({
        email: `  ${email.toUpperCase()}  `,
        password: PASSWORD,
      }).expect(201);

      expect(await findUsers(email)).toHaveLength(1);
    });

    it('accepts a password of exactly 8 characters', async () => {
      const email = uniqueEmail();

      await register({ email, password: '12345678' }).expect(201);

      expect(await findUsers(email)).toHaveLength(1);
    });

    describe('when the e-mail is already taken', () => {
      it('answers 409 and does not create a second user', async () => {
        const email = uniqueEmail();
        await register({ email, password: PASSWORD }).expect(201);

        const response = await register({
          email,
          password: 'another password',
        }).expect(409);

        expect(response.body.accessToken).toBeUndefined();
        expect(await findUsers(email)).toHaveLength(1);
      });

      it('compares e-mails case-insensitively', async () => {
        const email = uniqueEmail();
        await register({ email, password: PASSWORD }).expect(201);

        await register({
          email: email.toUpperCase(),
          password: PASSWORD,
        }).expect(409);

        expect(await findUsers(email)).toHaveLength(1);
      });

      it('does not overwrite the existing user’s password', async () => {
        const email = uniqueEmail();
        await register({ email, password: PASSWORD }).expect(201);
        const [before] = await findUsers(email);

        await register({ email, password: 'attacker password' }).expect(409);

        const [after] = await findUsers(email);
        expect(after.password_hash).toBe(before.password_hash);
        await login({ email, password: PASSWORD }).expect(200);
      });

      it('lets only one of several concurrent registrations win', async () => {
        const email = uniqueEmail();

        const responses = await Promise.all(
          Array.from({ length: 5 }, () =>
            register({ email, password: PASSWORD }),
          ),
        );

        const statuses = responses.map((response) => response.status);
        expect(statuses.filter((status) => status === 201)).toHaveLength(1);
        expect(statuses.filter((status) => status === 409)).toHaveLength(4);
        expect(await findUsers(email)).toHaveLength(1);
      });
    });

    describe('validation', () => {
      const validEmail = 'e2e-validation@example.test';

      it.each([
        ['an empty body', {}],
        ['a missing e-mail', { password: PASSWORD }],
        ['a missing password', { email: validEmail }],
        [
          'an e-mail without "@"',
          { email: 'not-an-email', password: PASSWORD },
        ],
        ['an e-mail without a domain', { email: 'user@', password: PASSWORD }],
        ['an empty e-mail', { email: '', password: PASSWORD }],
        ['a non-string e-mail', { email: 123, password: PASSWORD }],
        ['a non-string password', { email: validEmail, password: 12345678 }],
        ['an empty password', { email: validEmail, password: '' }],
        [
          'a password of 7 characters',
          { email: validEmail, password: '1234567' },
        ],
        [
          'a password longer than 128 characters',
          { email: validEmail, password: 'x'.repeat(129) },
        ],
      ])('answers 400 for %s and creates no user', async (_name, body) => {
        const usersBefore = await countUsers();

        const response = await register(body).expect(400);

        expect(response.body.accessToken).toBeUndefined();
        expect(await countUsers()).toBe(usersBefore);
      });
    });
  });

  describe('POST /auth/login', () => {
    let email: string;
    let userId: string;

    beforeAll(async () => {
      email = uniqueEmail();
      await register({ email, password: PASSWORD }).expect(201);
      [{ id: userId }] = await findUsers(email);
    });

    it('returns a JWT for the existing user', async () => {
      const response = await login({ email, password: PASSWORD }).expect(200);

      expectTokenFor(response.body.accessToken, userId);
    });

    it('returns only the token, without the password or its hash', async () => {
      const response = await login({ email, password: PASSWORD }).expect(200);

      expect(Object.keys(response.body)).toEqual(['accessToken']);
      expect(JSON.stringify(response.body)).not.toContain(PASSWORD);
    });

    it('does not create a user', async () => {
      const usersBefore = await countUsers();

      await login({ email, password: PASSWORD }).expect(200);

      expect(await countUsers()).toBe(usersBefore);
      expect(await findUsers(email)).toHaveLength(1);
    });

    it('issues a token for the same user on every login', async () => {
      const first = await login({ email, password: PASSWORD }).expect(200);
      const second = await login({ email, password: PASSWORD }).expect(200);

      expectTokenFor(first.body.accessToken, userId);
      expectTokenFor(second.body.accessToken, userId);
    });

    it('issues a token for the same user as the one registration returned', async () => {
      const freshEmail = uniqueEmail();
      const registered = await register({
        email: freshEmail,
        password: PASSWORD,
      }).expect(201);

      const loggedIn = await login({
        email: freshEmail,
        password: PASSWORD,
      }).expect(200);

      const registeredSub = verifyHs256Jwt(
        registered.body.accessToken,
        JWT_SECRET,
      ).sub;
      expectTokenFor(loggedIn.body.accessToken, registeredSub as string);
    });

    it('matches the e-mail case-insensitively and ignores surrounding spaces', async () => {
      const response = await login({
        email: `  ${email.toUpperCase()}  `,
        password: PASSWORD,
      }).expect(200);

      expectTokenFor(response.body.accessToken, userId);
    });

    describe('with bad credentials', () => {
      it('answers 401 for a wrong password', async () => {
        const response = await login({
          email,
          password: 'wrong password',
        }).expect(401);

        expect(response.body.accessToken).toBeUndefined();
      });

      it('treats the password as case-sensitive', async () => {
        await login({ email, password: PASSWORD.toUpperCase() }).expect(401);
      });

      it('answers 401 for an unknown e-mail and does not create a user', async () => {
        const unknownEmail = uniqueEmail();
        const usersBefore = await countUsers();

        const response = await login({
          email: unknownEmail,
          password: PASSWORD,
        }).expect(401);

        expect(response.body.accessToken).toBeUndefined();
        expect(await findUsers(unknownEmail)).toHaveLength(0);
        expect(await countUsers()).toBe(usersBefore);
      });

      it('gives the same answer for an unknown e-mail and a wrong password', async () => {
        const wrongPassword = await login({
          email,
          password: 'wrong password',
        }).expect(401);
        const unknownEmail = await login({
          email: uniqueEmail(),
          password: 'wrong password',
        }).expect(401);

        expect(unknownEmail.body).toEqual(wrongPassword.body);
      });
    });

    describe('validation', () => {
      it.each([
        ['an empty body', {}],
        ['a missing e-mail', { password: PASSWORD }],
        ['a missing password', { email: 'e2e-validation@example.test' }],
        [
          'an e-mail without "@"',
          { email: 'not-an-email', password: PASSWORD },
        ],
        [
          'an empty password',
          { email: 'e2e-validation@example.test', password: '' },
        ],
        [
          'a non-string password',
          { email: 'e2e-validation@example.test', password: 12345678 },
        ],
      ])('answers 400 for %s', async (_name, body) => {
        const response = await login(body).expect(400);

        expect(response.body.accessToken).toBeUndefined();
      });
    });
  });

  describe('GET /auth/me', () => {
    const me = (token?: string) => {
      const req = http().get('/auth/me');
      return token ? req.set('Authorization', `Bearer ${token}`) : req;
    };

    async function registerAndGetToken(email: string): Promise<string> {
      const response = await register({ email, password: PASSWORD }).expect(
        201,
      );
      return response.body.accessToken as string;
    }

    it('returns the id and e-mail of the token owner', async () => {
      const email = uniqueEmail();
      const token = await registerAndGetToken(email);
      const [user] = await findUsers(email);

      const response = await me(token).expect(200);

      expect(response.body).toEqual({ id: user.id, email });
    });

    it('never returns the password or its hash', async () => {
      const token = await registerAndGetToken(uniqueEmail());

      const response = await me(token).expect(200);

      expect(Object.keys(response.body).sort()).toEqual(['email', 'id']);
      expect(JSON.stringify(response.body)).not.toContain('password');
    });

    it('answers 401 without a token', async () => {
      await me().expect(401);
    });

    it('answers 401 for a malformed token', async () => {
      await me('not-a-jwt').expect(401);
    });

    it('answers 401 when the user was deleted after the token was issued', async () => {
      const email = uniqueEmail();
      const token = await registerAndGetToken(email);
      await pool.query('delete from users where email = $1', [email]);

      await me(token).expect(401);
    });
  });
});
