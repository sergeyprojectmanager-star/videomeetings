import { UnauthorizedException } from '@nestjs/common';
import type { PasswordHasher } from '@nestjs/authentication';
import type { QueryBus } from '@nestjs/cqrs';
import {
  FindUserByEmailQuery,
  type UserCredentials,
} from '../../users/index.js';
import type { AccessTokenService } from '../access-token.service.js';
import { LoginHandler } from './login.handler.js';
import { LoginQuery } from './login.query.js';

const user: UserCredentials = {
  id: 'user-id',
  email: 'jane@example.test',
  passwordHash: 'stored-hash',
};

describe('LoginHandler', () => {
  const queryBus = { execute: vi.fn<QueryBus['execute']>() };
  const passwordHasher = { verify: vi.fn<PasswordHasher['verify']>() };
  const tokens = { issueFor: vi.fn<AccessTokenService['issueFor']>() };

  const handler = new LoginHandler(
    queryBus as unknown as QueryBus,
    passwordHasher as unknown as PasswordHasher,
    tokens as unknown as AccessTokenService,
  );
  const query = new LoginQuery(user.email, 'plain password');

  beforeEach(() => {
    vi.resetAllMocks();
    queryBus.execute.mockResolvedValue(user);
    passwordHasher.verify.mockResolvedValue(true);
    tokens.issueFor.mockResolvedValue({ accessToken: 'jwt' });
  });

  it('returns a token for the user when the password is right', async () => {
    await expect(handler.execute(query)).resolves.toEqual({
      accessToken: 'jwt',
    });

    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'plain password',
      user.passwordHash,
    );
    expect(tokens.issueFor).toHaveBeenCalledWith(user.id);
  });

  it('asks the users module for the user by e-mail', async () => {
    await handler.execute(query);

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const [message] = queryBus.execute.mock.calls[0];
    expect(message).toBeInstanceOf(FindUserByEmailQuery);
    expect(message).toMatchObject({ email: user.email });
  });

  it('throws an UnauthorizedException and issues no token when the password is wrong', async () => {
    passwordHasher.verify.mockResolvedValue(false);

    await expect(handler.execute(query)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('throws an UnauthorizedException and issues no token for an unknown e-mail', async () => {
    queryBus.execute.mockResolvedValue(undefined);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(handler.execute(query)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('still verifies the password for an unknown e-mail, so the timing does not reveal it', async () => {
    queryBus.execute.mockResolvedValue(undefined);
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

    queryBus.execute.mockResolvedValue(undefined);
    const unknownEmail = await handler.execute(query).catch((e: unknown) => e);

    expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
    expect((unknownEmail as UnauthorizedException).getResponse()).toEqual(
      (wrongPassword as UnauthorizedException).getResponse(),
    );
  });

  it('only looks users up: it dispatches nothing but the lookup query', async () => {
    await handler.execute(query);
    queryBus.execute.mockResolvedValue(undefined);
    passwordHasher.verify.mockResolvedValue(false);
    await handler.execute(query).catch(() => undefined);

    for (const [message] of queryBus.execute.mock.calls) {
      expect(message).toBeInstanceOf(FindUserByEmailQuery);
    }
  });
});
