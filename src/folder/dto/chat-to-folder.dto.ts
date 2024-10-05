import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class ChatIdsDto {
  chatId: string;
}

export class ChatToFolderDto {
  @ApiProperty({
    type: ChatIdsDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatIdsDto)
  chatIds: ChatIdsDto[];

  @IsString()
  folderId: string;
}
