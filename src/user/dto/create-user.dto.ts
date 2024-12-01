import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
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

  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'Username must be at least 2 characters long',
  })
  @MaxLength(16, {
    message: 'Username must be no more than 16 characters long',
  })
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'Name must be at least 2 characters long',
  })
  @MaxLength(32, {
    message: 'Name must be no more than 32 characters long',
  })
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'Surname must be at least 2 characters long',
  })
  @MaxLength(32, {
    message: 'Surname must be no more than 32 characters long',
  })
  surname: string;

  @ApiProperty()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(70, {
    message: 'Bio must be no more than 70 characters long',
  })
  bio?: string;
}
