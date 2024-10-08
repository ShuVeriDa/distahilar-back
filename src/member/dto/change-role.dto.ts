import { MemberRole } from '@prisma/client';
import { IsString, Matches } from 'class-validator';

export class ChangeRoleDto {
  @IsString()
  chatId: string;

  @Matches(
    `^${Object.values(MemberRole)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  role: MemberRole;
}
