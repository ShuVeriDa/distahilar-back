import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateContactDto {
  @ApiProperty()
  @IsString()
  @IsUUID('4')
  userId: string;
}
