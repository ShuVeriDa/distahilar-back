import { IsBoolean, IsString } from 'class-validator';

export class DeleteChatDto {
  @IsBoolean()
  delete_both: boolean;

  @IsString()
  memberId: string;
}
