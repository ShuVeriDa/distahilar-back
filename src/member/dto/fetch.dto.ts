import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class FetchMemberDto {
  @ApiProperty({
    description: 'Chat identifier that member belongs to',
  })
  @IsString()
  @IsUUID('4')
  chatId: string;
}
