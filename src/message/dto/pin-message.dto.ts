import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class PinMessageDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  chatId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  messageId: string;
}
