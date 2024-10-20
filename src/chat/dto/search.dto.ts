import { IsOptional, IsString } from 'class-validator';

export class ChatSearchDto {
  @IsString()
  @IsOptional()
  name?: string;
}
