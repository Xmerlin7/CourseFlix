import { IsEmail, IsIn, MaxLength } from 'class-validator';

export class OtpRequestDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  // Which flow the code is for. 'register' resends the email-verification
  // code to an account that registered but hasn't verified yet.
  // 'google_oauth' resends the code the Google callback just mailed (so the
  // user can ask for a fresh one without going through Google again).
  @IsIn(['register', 'google_oauth'])
  purpose!: 'register' | 'google_oauth';
}
