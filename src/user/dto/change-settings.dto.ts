import { ApiProperty } from '@nestjs/swagger';
import { Language } from '@prisma/client';
import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class ChangeSettingsDto {
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  notifications: boolean;

  @ApiProperty({ enum: Language })
  @Matches(
    `^${Object.values(Language)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  language: Language;
}
