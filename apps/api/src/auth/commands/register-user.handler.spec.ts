import { ConflictException } from '@nestjs/common';
import type { PasswordHasher } from '@nestjs/authentication';
import type { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../../users/index.js';
import type { AccessTokenService } from '../access-token.service.js';
import { RegisterUserCommand } from './register-user.command.js';
import { RegisterUserHandler } from './register-user.handler.js';

const user = { id: 'user-id', email: 'jane@example.test' };

describe('RegisterUserHandler', () => {
  const commandBus = { execute: vi.fn<CommandBus['execute']>() };
  const passwordHasher = { hash: vi.fn<PasswordHasher['hash']>() };
  const tokens = { issueFor: vi.fn<AccessTokenService['issueFor']>() };

  const handler = new RegisterUserHandler(
    commandBus as unknown as CommandBus,
    passwordHasher as unknown as PasswordHasher,
    tokens as unknown as AccessTokenService,
  );
  const command = new RegisterUserCommand(user.email, 'plain password');

  beforeEach(() => {
    vi.resetAllMocks();
    passwordHasher.hash.mockResolvedValue('hashed password');
    commandBus.execute.mockResolvedValue(user);
    tokens.issueFor.mockResolvedValue({ accessToken: 'jwt' });
  });

  it('asks the users module to create the user, with the hash and not the password', async () => {
    await handler.execute(command);

    expect(passwordHasher.hash).toHaveBeenCalledWith('plain password');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const [message] = commandBus.execute.mock.calls[0];
    expect(message).toBeInstanceOf(CreateUserCommand);
    expect(message).toMatchObject({
      email: user.email,
      passwordHash: 'hashed password',
    });
    expect(JSON.stringify(message)).not.toContain('plain password');
  });

  it('returns a token for the created user', async () => {
    await expect(handler.execute(command)).resolves.toEqual({
      accessToken: 'jwt',
    });

    expect(tokens.issueFor).toHaveBeenCalledWith(user.id);
  });

  it('passes the 409 of the users module through and issues no token', async () => {
    commandBus.execute.mockRejectedValue(new ConflictException('taken'));

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('does not create a user when hashing fails', async () => {
    passwordHasher.hash.mockRejectedValue(new RangeError('too long'));

    await expect(handler.execute(command)).rejects.toThrow(RangeError);

    expect(commandBus.execute).not.toHaveBeenCalled();
    expect(tokens.issueFor).not.toHaveBeenCalled();
  });

  it('lets other errors from the users module through and issues no token', async () => {
    commandBus.execute.mockRejectedValue(new Error('db is down'));

    await expect(handler.execute(command)).rejects.toThrow('db is down');

    expect(tokens.issueFor).not.toHaveBeenCalled();
  });
});
