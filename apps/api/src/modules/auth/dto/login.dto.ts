import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // When true, a correct password does NOT create a session — a login OTP
  // is emailed instead, and the user signs in via POST /auth/otp/verify.
  @IsOptional()
  @IsBoolean()
  requireOtp?: boolean;
}
