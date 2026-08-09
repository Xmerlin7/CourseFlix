import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { RegisterDto } from './dto/register.dto';
import { ParamsTokenFactory } from '@nestjs/core/pipes';

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

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { token, session } = await this.sessionsService.createSession(
      user.id,
    );

    return {
      token,
      maxAgeMs: session.expiresAt.getTime() - Date.now(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        managedByTeacherId: user.managedByTeacherId,
      },
    };
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }
    await this.sessionsService.revokeSession(token);
  }

  async register(dto: RegisterDto): Promise<LoginResult> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use.');
    }

    const passwordHash = await argon2.hash(dto.password);
    const newUser = await this.usersService.createUser(
      dto.fullName,
      dto.email,
      passwordHash,
      'active', // Default status for new registrations
      'student', // Default role for new registrations
    );

    const { token, session } = await this.sessionsService.createSession(
      newUser.id,
    );

    return {
      token,
      maxAgeMs: session.expiresAt.getTime() - Date.now(),
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
        avatarUrl: newUser.avatarUrl,
        managedByTeacherId: newUser.managedByTeacherId,
      },
    };
  }
}
