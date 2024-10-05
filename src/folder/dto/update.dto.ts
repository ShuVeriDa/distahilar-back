import { IsEmpty, IsString, MinLength } from 'class-validator';

export class UpdateFolderDto {
  @IsString()
  @MinLength(2, {
    message: 'Title must be at least 2 characters long',
  })
  @IsEmpty()
  name?: string;
}
