import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsUUID } from 'class-validator';

export class DeleteChatDto {
  @ApiProperty()
  @IsBoolean()
  delete_both: boolean;

  @ApiProperty()
  @IsString()
  @IsUUID('4')
  memberId: string;
}
