import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class ChangeEmailDto {
  @IsEmail()
  newEmail: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;
}

export class ChangeHandleDto {
  @IsString()
  @IsNotEmpty()
  newHandle: string;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;
}