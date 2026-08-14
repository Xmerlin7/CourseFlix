import { IsOptional, IsString, IsUrl, Length, Matches } from 'class-validator';

// Self-service counterpart of admin's UpdateUserDto — same shape,
// separate class because the two are reached via different guards
// (self vs admin-on-any-user) and shouldn't be coupled by a shared type.
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  fullName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 32)
  @Matches(/^[+\d\s().-]*$/, {
    message: 'whatsappNumber must contain only digits and phone symbols.',
  })
  whatsappNumber?: string | null;
}
