import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

/** The user a request was authenticated as; set by `JwtAuthGuard`. */
export interface AuthenticatedUser {
  id: string;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/**
 * Protects a route with the access token from `POST /auth/register` or
 * `POST /auth/login`, sent as `Authorization: Bearer <token>`. Answers 401 for a
 * missing, malformed, forged or expired token. Apply with `@UseGuards(JwtAuthGuard)`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: { sub?: unknown };
    try {
      payload = await this.jwt.verifyAsync<{ sub?: unknown }>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException();
    }
    if (typeof payload.sub !== 'string') {
      throw new UnauthorizedException();
    }

    request.user = { id: payload.sub };
    return true;
  }
}

function bearerToken(header: string | undefined): string | undefined {
  const [scheme, token, ...rest] = header?.split(' ') ?? [];
  return scheme === 'Bearer' && token && rest.length === 0 ? token : undefined;
}
