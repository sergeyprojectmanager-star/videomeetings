import { UnauthorizedException } from '@nestjs/common';
import type { PasswordHasher } from '@nestjs/authentication';
import type { User, UsersService } from '../../users/users.service.js';
import type { AccessTokenService } from '../access-token.service.js';
import { LoginHandler } from './login.handler.js';
import { LoginQuery } from './login.query.js';

const user: User = {
  id: 'user-id',
  email: 'jane@example.test',
  passwordHash: 'stored-hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('LoginHandler', () => {
  const users = {
    findByEmail: vi.fn<UsersService['findByEmail']>(),
    // Login must only read: a create() call would be a bug.
    create: vi.fn<UsersService['create']>(),
  };
  const passwordHasher = { verify: vi.fn<PasswordHasher['verify']>() };
  const tokens = { issueFor: vi.fn<AccessTokenService['issueFor']>() };

  const handler = new LoginHandler(
    users as unknown as UsersService,
    passwordHasher as unknown as PasswordHasher,
    tokens as unknown as AccessTokenService,
  );
  const query = new LoginQuery(user.email, 'plain password');

  beforeEach(() => {
    vi.resetAllMocks();
    users.findByEmail.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);
    tokens.issueFor.mockResolvedValue({ accessToken: 'jwt' });
  });

  it('returns a token for the user when the password is right', async () => {
    await expect(handler.execute(query)).resolves.toEqual({
      accessToken: 'jwt',
    });

    expect(users.findByEmail).toHaveBeenCalledWith(user.email);
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'plain password',
      user.passwordHash,
    );
    expect(tokens.issueFor).toHaveBeenCalledWith(user.id);
  });

  it('throws an UnauthorizedException and issues no token when the password is wrong', async () => {
    passwordHasher.verify.mockResolvedValue(false);

    await expect(handler.execute(query)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('throws an UnauthorizedException and issues no token for an unknown e-mail', async () => {
    users.findByEmail.mockResolvedValue(undefined);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(handler.execute(query)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('still verifies the password for an unknown e-mail, so the timing does not reveal it', async () => {
    users.findByEmail.mockResolvedValue(undefined);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(handler.execute(query)).rejects.toThrow();

    // `undefined` makes PasswordHasher check a dummy hash instead.
    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'plain password',
      undefined,
    );
  });

  it('gives the same error for an unknown e-mail and a wrong password', async () => {
    passwordHasher.verify.mockResolvedValue(false);
    const wrongPassword = await handler.execute(query).catch((e: unknown) => e);

    users.findByEmail.mockResolvedValue(undefined);
    const unknownEmail = await handler.execute(query).catch((e: unknown) => e);

    expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
    expect((unknownEmail as UnauthorizedException).getResponse()).toEqual(
      (wrongPassword as UnauthorizedException).getResponse(),
    );
  });

  it('does not create a user', async () => {
    await handler.execute(query);
    users.findByEmail.mockResolvedValue(undefined);
    passwordHasher.verify.mockResolvedValue(false);
    await handler.execute(query).catch(() => undefined);

    expect(users.create).not.toHaveBeenCalled();
  });
});
