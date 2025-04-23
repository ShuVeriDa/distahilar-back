import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString, IsUUID } from 'class-validator';

export class DeleteMessageDto {
  @ApiProperty()
  @IsString()
  @IsUUID('4')
  chatId: string;

  @ApiProperty({
    type: String,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  messageIds: string[];

  @ApiProperty()
  @IsBoolean()
  delete_both: boolean;
}
