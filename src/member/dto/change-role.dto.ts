import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { IsString, IsUUID, Matches } from 'class-validator';

export class ChangeRoleDto {
  @ApiProperty()
  @IsString()
  @IsUUID('4')
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
