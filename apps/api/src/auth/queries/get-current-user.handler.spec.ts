import { UnauthorizedException } from '@nestjs/common';
import type { User, UsersService } from '../../users/users.service.js';
import { GetCurrentUserHandler } from './get-current-user.handler.js';
import { GetCurrentUserQuery } from './get-current-user.query.js';

const user: User = {
  id: 'user-id',
  email: 'jane@example.test',
  passwordHash: 'stored-hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('GetCurrentUserHandler', () => {
  const users = {
    findById: vi.fn<UsersService['findById']>(),
    // A query must only read: a create() call would be a bug.
    create: vi.fn<UsersService['create']>(),
  };
  const handler = new GetCurrentUserHandler(users as unknown as UsersService);
  const query = new GetCurrentUserQuery(user.id);

  beforeEach(() => {
    vi.resetAllMocks();
    users.findById.mockResolvedValue(user);
  });

  it('returns the id and e-mail of the user', async () => {
    await expect(handler.execute(query)).resolves.toEqual({
      id: user.id,
      email: user.email,
    });

    expect(users.findById).toHaveBeenCalledWith(user.id);
  });

  it('never exposes the password hash', async () => {
    const profile = await handler.execute(query);

    expect(Object.keys(profile).sort()).toEqual(['email', 'id']);
    expect(JSON.stringify(profile)).not.toContain(user.passwordHash);
  });

  it('throws an UnauthorizedException when the user no longer exists', async () => {
    users.findById.mockResolvedValue(undefined);

    await expect(handler.execute(query)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('writes nothing', async () => {
    await handler.execute(query);

    expect(users.create).not.toHaveBeenCalled();
  });
});
