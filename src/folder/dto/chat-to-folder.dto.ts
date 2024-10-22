import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class ChatToFolderDto {
  @ApiProperty({
    type: String,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  chatIds: string[];

  @ApiProperty()
  @IsString()
  @IsUUID('4')
  folderId: string;
}
