import type { User, UsersService } from '../users.service.js';
import { FindUserByEmailHandler } from './find-user-by-email.handler.js';
import { FindUserByEmailQuery } from './find-user-by-email.query.js';

const user: User = {
  id: 'user-id',
  email: 'jane@example.test',
  passwordHash: 'stored-hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('FindUserByEmailHandler', () => {
  const users = {
    findByEmail: vi.fn<UsersService['findByEmail']>(),
    // A query must only read: a create() call would be a bug.
    create: vi.fn<UsersService['create']>(),
  };
  const handler = new FindUserByEmailHandler(users as unknown as UsersService);

  beforeEach(() => {
    vi.resetAllMocks();
    users.findByEmail.mockResolvedValue(user);
  });

  it('returns the id, e-mail and password hash of the user', async () => {
    await expect(
      handler.execute(new FindUserByEmailQuery(user.email)),
    ).resolves.toEqual({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
    });
  });

  it('does not leak other columns', async () => {
    const result = await handler.execute(new FindUserByEmailQuery(user.email));

    expect(Object.keys(result ?? {}).sort()).toEqual([
      'email',
      'id',
      'passwordHash',
    ]);
  });

  it('looks the e-mail up normalized', async () => {
    await handler.execute(new FindUserByEmailQuery(' Jane@Example.TEST '));

    expect(users.findByEmail).toHaveBeenCalledWith('jane@example.test');
  });

  it('returns undefined for an unknown e-mail', async () => {
    users.findByEmail.mockResolvedValue(undefined);

    await expect(
      handler.execute(new FindUserByEmailQuery('nobody@example.test')),
    ).resolves.toBeUndefined();
  });

  it('writes nothing', async () => {
    await handler.execute(new FindUserByEmailQuery(user.email));

    expect(users.create).not.toHaveBeenCalled();
  });
});
