import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FetchChatsDto {
  @ApiProperty({
    description: 'Folder identifier to fetch chats from',
  })
  @IsString()
  folder: string;
}
