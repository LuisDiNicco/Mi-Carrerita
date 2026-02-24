/**
 * Authentication DTOs for register/login flows
 */
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El email no es válido.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'El email no es válido.' })
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(128)
  newPassword!: string;
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken?: string; // Only returned on successful login/register
  user?: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
  };
}
