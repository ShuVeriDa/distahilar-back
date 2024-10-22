import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChatDto {
  // @Matches(
  //   `^${Object.values(ChatRole)
  //     .filter((v) => typeof v !== 'number')
  //     .join('|')}$`,
  //   'i',
  // )
  // type: ChatRole;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Username must be at least 2 characters long',
  })
  @MaxLength(16, {
    message: 'Username must be no more than 16 characters long',
  })
  username: string;

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
  @MaxLength(300, {
    message: 'Description must be no more than 32 characters long',
  })
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;
}
