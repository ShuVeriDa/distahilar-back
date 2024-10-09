import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class DeleteChatDto {
  @ApiProperty()
  @IsBoolean()
  delete_both: boolean;

  @ApiProperty()
  @IsString()
  memberId: string;
}
