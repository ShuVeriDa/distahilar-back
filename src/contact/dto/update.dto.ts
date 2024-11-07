import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateContactDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Name must be at least 2 characters long',
  })
  @MaxLength(32, {
    message: 'Name must be no more than 32 characters long',
  })
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Surname must be at least 2 characters long',
  })
  @MaxLength(32, {
    message: 'Surname must be no more than 32 characters long',
  })
  surname?: string;
}
