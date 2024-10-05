import { IsBoolean } from 'class-validator';

export class DeleteChatDto {
  @IsBoolean()
  delete_both: boolean;
}
