import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ContactSearchDto {
  @ApiProperty({
    description: 'Optional name filter',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
