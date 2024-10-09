import { ChatRole } from '@prisma/client';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Password must be at least 2 characters long',
  })
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  imageUrl: string;

  @Matches(
    `^${Object.values(ChatRole)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  type: ChatRole;
}
