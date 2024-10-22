import { IsString, IsUUID } from 'class-validator';

export class FetchMessageDto {
  @IsString()
  @IsUUID('4')
  chatId: string;

  @IsString()
  cursor: string;
}
