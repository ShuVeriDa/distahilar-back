import { IsString, IsUUID } from 'class-validator';

export class FetchMemberDto {
  @IsString()
  @IsUUID('4')
  chatId: string;
}
