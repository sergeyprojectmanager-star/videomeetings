import type { User, UsersService } from '../users.service.js';
import { FindUserByIdHandler } from './find-user-by-id.handler.js';
import { FindUserByIdQuery } from './find-user-by-id.query.js';

const user: User = {
  id: 'user-id',
  email: 'jane@example.test',
  passwordHash: 'stored-hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('FindUserByIdHandler', () => {
  const users = {
    findById: vi.fn<UsersService['findById']>(),
    // A query must only read: a create() call would be a bug.
    create: vi.fn<UsersService['create']>(),
  };
  const handler = new FindUserByIdHandler(users as unknown as UsersService);
  const query = new FindUserByIdQuery(user.id);

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

    expect(Object.keys(profile ?? {}).sort()).toEqual(['email', 'id']);
    expect(JSON.stringify(profile)).not.toContain(user.passwordHash);
  });

  it('returns undefined for an unknown id', async () => {
    users.findById.mockResolvedValue(undefined);

    await expect(handler.execute(query)).resolves.toBeUndefined();
  });

  it('writes nothing', async () => {
    await handler.execute(query);

    expect(users.create).not.toHaveBeenCalled();
  });
});
