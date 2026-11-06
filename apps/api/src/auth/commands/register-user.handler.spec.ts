import { ConflictException } from '@nestjs/common';
import type { PasswordHasher } from '@nestjs/authentication';
import type { User, UsersService } from '../../users/users.service.js';
import type { AccessTokenService } from '../access-token.service.js';
import { RegisterUserCommand } from './register-user.command.js';
import { RegisterUserHandler } from './register-user.handler.js';

const user: User = {
  id: 'user-id',
  email: 'jane@example.test',
  passwordHash: 'stored-hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('RegisterUserHandler', () => {
  const users = { create: vi.fn<UsersService['create']>() };
  const passwordHasher = { hash: vi.fn<PasswordHasher['hash']>() };
  const tokens = { issueFor: vi.fn<AccessTokenService['issueFor']>() };

  const handler = new RegisterUserHandler(
    users as unknown as UsersService,
    passwordHasher as unknown as PasswordHasher,
    tokens as unknown as AccessTokenService,
  );
  const command = new RegisterUserCommand(user.email, 'plain password');

  beforeEach(() => {
    vi.resetAllMocks();
    passwordHasher.hash.mockResolvedValue('hashed password');
    users.create.mockResolvedValue(user);
    tokens.issueFor.mockResolvedValue({ accessToken: 'jwt' });
  });

  it('stores the hash of the password, not the password', async () => {
    await handler.execute(command);

    expect(passwordHasher.hash).toHaveBeenCalledWith('plain password');
    expect(users.create).toHaveBeenCalledWith(user.email, 'hashed password');
  });

  it('returns a token for the created user', async () => {
    await expect(handler.execute(command)).resolves.toEqual({
      accessToken: 'jwt',
    });

    expect(tokens.issueFor).toHaveBeenCalledWith(user.id);
  });

  it('throws a ConflictException and issues no token when the e-mail is taken', async () => {
    users.create.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('does not create a user when hashing fails', async () => {
    passwordHasher.hash.mockRejectedValue(new RangeError('too long'));

    await expect(handler.execute(command)).rejects.toThrow(RangeError);

    expect(users.create).not.toHaveBeenCalled();
    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('lets repository errors through and issues no token', async () => {
    users.create.mockRejectedValue(new Error('db is down'));

    await expect(handler.execute(command)).rejects.toThrow('db is down');

    expect(tokens.issueFor).not.toHaveBeenCalled();
  });
});
