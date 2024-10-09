import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChatDto {
  // @Matches(
  //   `^${Object.values(ChatRole)
  //     .filter((v) => typeof v !== 'number')
  //     .join('|')}$`,
  //   'i',
  // )
  // type: ChatRole;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Password must be at least 2 characters long',
  })
  username: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2, {
    message: 'Password must be at least 2 characters long',
  })
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;
}
