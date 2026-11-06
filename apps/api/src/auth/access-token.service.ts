import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AuthResult {
  accessToken: string;
}

/** Issues access tokens; the one place that decides what a token contains. */
@Injectable()
export class AccessTokenService {
  constructor(private readonly jwt: JwtService) {}

  async issueFor(userId: string): Promise<AuthResult> {
    return { accessToken: await this.jwt.signAsync({ sub: userId }) };
  }
}
