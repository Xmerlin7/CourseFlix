import { IsEmail, IsIn, IsString, Matches, MaxLength } from 'class-validator';

export class OtpVerifyDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code!: string;

  @IsIn(['register', 'google_oauth'])
  purpose!: 'register' | 'google_oauth';
}
