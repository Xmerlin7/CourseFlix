import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
    @IsString() @MinLength(3) fullName!: string;
    @IsEmail() email!: string;
    @IsString() @MinLength(8) password!: string;
    // No role field — ValidationPipe.forbidNonWhitelisted rejects extras with 400
}