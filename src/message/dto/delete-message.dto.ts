import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class DeleteMessageDto {
  @ApiProperty()
  @IsString()
  chatId: string;

  @ApiProperty()
  @IsString()
  messageId: string;

  @ApiProperty()
  @IsBoolean()
  delete_both: boolean;
}
