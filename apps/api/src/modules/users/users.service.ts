import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  findByEmail(email: string) {
    return {
      TODO: 'Load user by normalized email, including password hash for login only.',
      email,
    };
  }

  findById(userId: string) {
    return {
      TODO: 'Load safe user profile without password hash or session data.',
      userId,
    };
  }
}
