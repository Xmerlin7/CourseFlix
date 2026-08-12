import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { OtpCodeEntity } from './entities/otp-code.entity';
import { OtpService } from './otp.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCodeEntity]), MailModule],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
