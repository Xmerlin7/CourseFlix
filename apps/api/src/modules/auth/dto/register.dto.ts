import {
  Equals,
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { PASSWORD_HINT, PASSWORD_PATTERN } from './password-policy';

export class RegisterDto {
  @IsString() @MinLength(3) fullName!: string;
  @IsEmail() email!: string;
  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_HINT })
  password!: string;
  // Server-side backstop for the terms/privacy checkboxes the register
  // wizard requires — rejects direct API calls that skip them, not just
  // a disabled submit button on the client.
  @IsBoolean()
  @Equals(true, {
    message: 'You must accept the Terms & Conditions and Privacy Policy.',
  })
  acceptedTerms!: boolean;
  // No role field — ValidationPipe.forbidNonWhitelisted rejects extras with 400
}
