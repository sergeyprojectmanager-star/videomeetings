import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { type AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard.js';

function contextFor(request: Partial<AuthenticatedRequest>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwt = { verifyAsync: vi.fn<JwtService['verifyAsync']>() };
  const guard = new JwtAuthGuard(jwt as unknown as JwtService);

  beforeEach(() => {
    vi.resetAllMocks();
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-id' });
  });

  it('lets a valid Bearer token through and exposes the user', async () => {
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer some.jwt.token' },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);

    expect(request.user).toEqual({ id: 'user-id' });
    expect(jwt.verifyAsync).toHaveBeenCalledWith('some.jwt.token', {
      algorithms: ['HS256'],
    });
  });

  it.each([
    ['no Authorization header', undefined],
    ['an empty header', ''],
    ['a scheme without a token', 'Bearer'],
    ['another scheme', 'Basic abc'],
    ['a bare token', 'some.jwt.token'],
    ['extra parts', 'Bearer a b'],
  ])('rejects %s without verifying anything', async (_name, authorization) => {
    const request = { headers: { authorization } };

    await expect(
      guard.canActivate(contextFor(request as Partial<AuthenticatedRequest>)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects a token that fails verification', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer bad' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a verified token without a string "sub"', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 42 });

    await expect(
      guard.canActivate(
        contextFor({ headers: { authorization: 'Bearer odd' } }),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
