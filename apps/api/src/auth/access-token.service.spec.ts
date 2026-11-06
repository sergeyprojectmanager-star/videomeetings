import type { JwtService } from '@nestjs/jwt';
import { AccessTokenService } from './access-token.service.js';

describe('AccessTokenService', () => {
  const jwt = { signAsync: vi.fn<JwtService['signAsync']>() };
  const service = new AccessTokenService(jwt as unknown as JwtService);

  beforeEach(() => {
    vi.resetAllMocks();
    jwt.signAsync.mockResolvedValue('signed.jwt.token');
  });

  it('returns the signed token as accessToken', async () => {
    await expect(service.issueFor('user-id')).resolves.toEqual({
      accessToken: 'signed.jwt.token',
    });
  });

  it('puts only the user id, as "sub", into the payload', async () => {
    await service.issueFor('user-id');

    expect(jwt.signAsync).toHaveBeenCalledTimes(1);
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'user-id' });
  });

  it('fails when signing fails', async () => {
    jwt.signAsync.mockRejectedValue(
      new Error('secretOrPrivateKey must have a value'),
    );

    await expect(service.issueFor('user-id')).rejects.toThrow(
      'secretOrPrivateKey must have a value',
    );
  });
});
