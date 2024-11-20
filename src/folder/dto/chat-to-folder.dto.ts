import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

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
  folderId: string;
}
