import { IsString } from 'class-validator';

export class FetchChatsDto {
  @IsString()
  folder: string;
}
