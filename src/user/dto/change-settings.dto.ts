import { Language } from '@prisma/client';
import { IsBoolean, IsOptional, Matches } from 'class-validator';

export class ChangeSettingsDto {
  @IsOptional()
  @IsBoolean()
  notifications: boolean;

  @Matches(
    `^${Object.values(Language)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  language: Language;
}
