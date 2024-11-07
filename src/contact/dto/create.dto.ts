import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Name must be at least 2 characters long',
  })
  @MaxLength(32, {
    message: 'Name must be no more than 32 characters long',
  })
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Surname must be at least 2 characters long',
  })
  @MaxLength(32, {
    message: 'Surname must be no more than 32 characters long',
  })
  surname: string;

  @ApiProperty()
  @IsString()
  @IsUUID('4')
  userId: string;
}
