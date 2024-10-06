import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Password must be at least 2 characters long',
  })
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  imageUrl: string;
}
