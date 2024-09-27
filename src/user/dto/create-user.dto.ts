import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  // @MinLength(6, {
  //   message: 'Password must be at least 6 characters long',
  // })
  @IsString()
  @IsStrongPassword({
    minLength: 6,
    minUppercase: 1,
    minSymbols: 1,
  })
  password: string;

  @IsString()
  @MinLength(2, {
    message: 'Username must be at least 2 characters long',
  })
  username: string;

  @IsString()
  @MinLength(2, {
    message: 'Name must be at least 2 characters long',
  })
  name: string;

  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  bio: string;
}

// Логин, пароль, username, телефон, аватар, name, descriptions (bio)
