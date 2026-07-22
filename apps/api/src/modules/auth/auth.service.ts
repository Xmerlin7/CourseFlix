import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

export interface LoginResult {
  token: string;
  maxAgeMs: number;
  user: AuthenticatedUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.usersService.findByEmail(loginDto.email);

    // Same generic error whether the email doesn't exist or the password
    // is wrong — never reveal which one it was (CF-US-002 requirement).
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, loginDto.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { token, session } = await this.sessionsService.createSession(user.id);

    return {
      token,
      maxAgeMs: session.expiresAt.getTime() - Date.now(),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    await this.sessionsService.revokeSession(token);
  }

  async getCurrentUser(token: string | undefined): Promise<AuthenticatedUser> {
    const session = token ? await this.sessionsService.findActiveSession(token) : null;

    if (!session) {
      throw new UnauthorizedException('Not authenticated.');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };
  }
}