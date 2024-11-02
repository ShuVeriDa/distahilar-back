import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'Title must be at least 2 characters long',
  })
  @MaxLength(16, {
    message: 'Name must be no more than 16 characters long',
  })
  name: string;

  @ApiProperty()
  @IsString()
  imageUrl: string;
}
