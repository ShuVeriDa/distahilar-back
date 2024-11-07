import { ApiProperty } from '@nestjs/swagger';
import { ChatRole } from '@prisma/client';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCommunityDto {
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300, {
    message: 'Description must be no more than 32 characters long',
  })
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
