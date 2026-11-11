import { UnauthorizedException } from '@nestjs/common';
import type { QueryBus } from '@nestjs/cqrs';
import { FindUserByIdQuery } from '../../users/index.js';
import { GetCurrentUserHandler } from './get-current-user.handler.js';
import { GetCurrentUserQuery } from './get-current-user.query.js';

const profile = { id: 'user-id', email: 'jane@example.test' };

describe('GetCurrentUserHandler', () => {
  const queryBus = { execute: vi.fn<QueryBus['execute']>() };
  const handler = new GetCurrentUserHandler(queryBus as unknown as QueryBus);
  const query = new GetCurrentUserQuery(profile.id);

  beforeEach(() => {
    vi.resetAllMocks();
    queryBus.execute.mockResolvedValue(profile);
  });

  it('asks the users module for the user by id and returns the profile', async () => {
    await expect(handler.execute(query)).resolves.toEqual(profile);

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const [message] = queryBus.execute.mock.calls[0];
    expect(message).toBeInstanceOf(FindUserByIdQuery);
    expect(message).toMatchObject({ id: profile.id });
  });

  it('throws an UnauthorizedException when the user no longer exists', async () => {
    queryBus.execute.mockResolvedValue(undefined);

    await expect(handler.execute(query)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lets errors from the users module through', async () => {
    queryBus.execute.mockRejectedValue(new Error('db is down'));

    await expect(handler.execute(query)).rejects.toThrow('db is down');
  });
});
