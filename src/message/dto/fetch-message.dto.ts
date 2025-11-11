import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class FetchMessageDto {
  @ApiProperty({ description: 'Chat identifier' })
  @IsString()
  @IsUUID('4')
  chatId: string;

  @ApiProperty({
    description: 'Cursor for pagination (message id or timestamp)',
  })
  @IsString()
  cursor: string;
}
