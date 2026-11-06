import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { JwtService } from '@nestjs/jwt';
import { UsersService, type User } from '../users/users.service.js';
import type { LoginDto, RegisterDto } from './auth.schemas.js';

export interface AuthResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async register({ email, password }: RegisterDto): Promise<AuthResult> {
    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.users.create(email, passwordHash);
    if (!user) {
      throw new ConflictException('Email already registered');
    }
    return this.issueToken(user);
  }

  async login({ email, password }: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(email);
    // With no user, verify() checks a dummy hash: an unknown e-mail and a wrong
    // password take the same time and give the same answer.
    const valid = await this.passwordHasher.verify(
      password,
      user?.passwordHash,
    );
    if (!user || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user);
  }

  private async issueToken(user: User): Promise<AuthResult> {
    return { accessToken: await this.jwt.signAsync({ sub: user.id }) };
  }
}
