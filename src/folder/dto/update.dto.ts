import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateFolderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: 'Title must be at least 2 characters long',
  })
  @MaxLength(12, {
    message: 'Name must be no more than 12 characters long',
  })
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
