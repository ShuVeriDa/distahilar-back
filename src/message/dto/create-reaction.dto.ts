import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateReactionDto {
  @ApiProperty()
  @IsString()
  @IsUUID('4')
  chatId: string;

  @ApiProperty()
  @IsString()
  @IsUUID('4')
  messageId: string;

  @ApiProperty()
  @IsString()
  emoji: string;
}
