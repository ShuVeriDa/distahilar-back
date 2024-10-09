import { ApiProperty } from '@nestjs/swagger';
import { ChatRole } from '@prisma/client';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Password must be at least 2 characters long',
  })
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    enum: ChatRole,
    description: `${ChatRole.CHANNEL} | ${ChatRole.GROUP}`,
  })
  @Matches(
    `^${Object.values(ChatRole)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  type: ChatRole;
}
