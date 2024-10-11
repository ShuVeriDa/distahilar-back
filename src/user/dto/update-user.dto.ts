import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  // @MinLength(6, {
  //   message: 'Password must be at least 6 characters long',
  // })
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsStrongPassword({
    minLength: 6,
    minUppercase: 1,
    minSymbols: 1,
  })
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: 'Username must be at least 2 characters long',
  })
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: 'Name must be at least 2 characters long',
  })
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ApiProperty()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}