import { MediaType, MessageType } from '@prisma/client';
import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  chatId: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  mediaId?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @Matches(
    `^${Object.values(MessageType)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  messageType: MessageType;

  @IsOptional()
  @Matches(
    `^${Object.values(MediaType)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  mediaType?: MediaType;
}
