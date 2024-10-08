import { IsString } from 'class-validator';

export class FetchMemberDto {
  @IsString()
  chatId: string;
}
