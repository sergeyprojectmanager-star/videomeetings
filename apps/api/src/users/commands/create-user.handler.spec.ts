import { ConflictException } from '@nestjs/common';
import type { User, UsersService } from '../users.service.js';
import { CreateUserCommand } from './create-user.command.js';
import { CreateUserHandler } from './create-user.handler.js';

const user: User = {
  id: 'user-id',
  email: 'jane@example.test',
  passwordHash: 'stored-hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('CreateUserHandler', () => {
  const users = { create: vi.fn<UsersService['create']>() };
  const handler = new CreateUserHandler(users as unknown as UsersService);
  const command = new CreateUserCommand(user.email, 'hashed password');

  beforeEach(() => {
    vi.resetAllMocks();
    users.create.mockResolvedValue(user);
  });

  it('stores the e-mail and the given hash', async () => {
    await handler.execute(command);

    expect(users.create).toHaveBeenCalledWith(user.email, 'hashed password');
  });

  it('returns the id and e-mail of the new user, without the hash', async () => {
    const profile = await handler.execute(command);

    expect(profile).toEqual({ id: user.id, email: user.email });
    expect(JSON.stringify(profile)).not.toContain(user.passwordHash);
  });

  it('normalizes the e-mail itself instead of trusting the caller', async () => {
    await handler.execute(
      new CreateUserCommand('  Jane@Example.TEST ', 'hashed password'),
    );

    expect(users.create).toHaveBeenCalledWith(
      'jane@example.test',
      'hashed password',
    );
  });

  it('throws a ConflictException when the e-mail is taken', async () => {
    users.create.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('lets repository errors through', async () => {
    users.create.mockRejectedValue(new Error('db is down'));

    await expect(handler.execute(command)).rejects.toThrow('db is down');
  });
});
