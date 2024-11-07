import { IsOptional, IsString } from 'class-validator';

export class ContactSearchDto {
  @IsString()
  @IsOptional()
  name?: string;
}
