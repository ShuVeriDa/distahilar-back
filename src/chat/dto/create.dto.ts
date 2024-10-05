import { ChatRole } from '@prisma/client';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateChatDto {
  @Matches(
    `^${Object.values(ChatRole)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  type: ChatRole;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Password must be at least 2 characters long',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Password must be at least 2 characters long',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;
}
