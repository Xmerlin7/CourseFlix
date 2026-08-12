import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailModule } from '../mail/mail.module';
import { OtpModule } from '../otp/otp.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    SessionsModule,
    OtpModule,
    MailModule,
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_SECONDS ?? 900) * 1000,
        limit: Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS ?? 5),
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
