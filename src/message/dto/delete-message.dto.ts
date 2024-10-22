import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsUUID } from 'class-validator';

export class DeleteMessageDto {
  @ApiProperty()
  @IsString()
  @IsUUID('4')
  chatId: string;

  @ApiProperty()
  @IsString()
  @IsUUID('4')
  messageId: string;

  @ApiProperty()
  @IsBoolean()
  delete_both: boolean;
}
