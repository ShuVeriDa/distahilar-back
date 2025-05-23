import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFolderDto {
  @ApiProperty()
  @IsString()
  @MinLength(2, {
    message: 'Title must be at least 2 characters long',
  })
  @MaxLength(12, {
    message: 'Name must be no more than 12 characters long',
  })
  name: string;

  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiProperty({
    type: String,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  chatIds: string[];
}
