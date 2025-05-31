import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class DeleteChatDto {
  @ApiProperty()
  @IsBoolean()
  delete_both: boolean;
}
