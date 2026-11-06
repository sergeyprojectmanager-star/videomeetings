import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthController } from './auth.controller.js';
import { RegisterUserCommand } from './commands/register-user.command.js';
import { LoginQuery } from './queries/login.query.js';

describe('AuthController', () => {
  const commandBus = { execute: vi.fn<CommandBus['execute']>() };
  const queryBus = { execute: vi.fn<QueryBus['execute']>() };
  const controller = new AuthController(
    commandBus as unknown as CommandBus,
    queryBus as unknown as QueryBus,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    commandBus.execute.mockResolvedValue({ accessToken: 'registered-jwt' });
    queryBus.execute.mockResolvedValue({ accessToken: 'login-jwt' });
  });

  describe('register', () => {
    it('dispatches a RegisterUserCommand and returns its result', async () => {
      const result = await controller.register({
        email: 'jane@example.test',
        password: 'plain password',
      });

      expect(result).toEqual({ accessToken: 'registered-jwt' });
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const [command] = commandBus.execute.mock.calls[0];
      expect(command).toBeInstanceOf(RegisterUserCommand);
      expect(command).toMatchObject({
        email: 'jane@example.test',
        password: 'plain password',
      });
      expect(queryBus.execute).not.toHaveBeenCalled();
    });

    it('passes errors from the handler through', async () => {
      commandBus.execute.mockRejectedValue(new Error('taken'));

      await expect(
        controller.register({ email: 'a@example.test', password: '12345678' }),
      ).rejects.toThrow('taken');
    });
  });

  describe('login', () => {
    it('dispatches a LoginQuery and returns its result', async () => {
      const result = await controller.login({
        email: 'jane@example.test',
        password: 'plain password',
      });

      expect(result).toEqual({ accessToken: 'login-jwt' });
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const [query] = queryBus.execute.mock.calls[0];
      expect(query).toBeInstanceOf(LoginQuery);
      expect(query).toMatchObject({
        email: 'jane@example.test',
        password: 'plain password',
      });
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('passes errors from the handler through', async () => {
      queryBus.execute.mockRejectedValue(new Error('bad credentials'));

      await expect(
        controller.login({ email: 'a@example.test', password: 'x' }),
      ).rejects.toThrow('bad credentials');
    });
  });
});
