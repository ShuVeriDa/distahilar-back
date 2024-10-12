import { IsString } from 'class-validator';

export class FetchMessageDto {
  @IsString()
  chatId: string;

  @IsString()
  cursor: string;
}
