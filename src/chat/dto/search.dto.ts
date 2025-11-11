import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatSearchDto {
  @ApiProperty({
    description: 'Name search query',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
