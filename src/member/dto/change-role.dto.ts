import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { IsString, Matches } from 'class-validator';

export class ChangeRoleDto {
  @ApiProperty()
  @IsString()
  chatId: string;

  @ApiProperty({ enum: MemberRole })
  @Matches(
    `^${Object.values(MemberRole)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  role: MemberRole;
}
