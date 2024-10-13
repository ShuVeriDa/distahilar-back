import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class DeleteMessageDto {
  @IsString()
  chatId: string;

  @IsString()
  messageId: string;

  @ApiProperty()
  @IsBoolean()
  delete_both: boolean;
}
