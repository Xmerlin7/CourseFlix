import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  login(loginDto: LoginDto) {
    return {
      TODO: 'Validate credentials, create server-side session, and set HTTP-only cookie.',
      email: loginDto.email,
    };
  }

  logout() {
    return {
      TODO: 'Revoke the active session and clear the session cookie.',
    };
  }

  getCurrentUser() {
    return {
      TODO: 'Read authenticated user from the session guard.',
    };
  }
}
