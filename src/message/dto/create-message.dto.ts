import { ApiProperty } from '@nestjs/swagger';
import { MediaType, MessageType } from '@prisma/client';
import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  chatId: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mediaId?: string;

  //This url for media or videoMessage or voiceMessage
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  url?: string;

  //This duration for videoMessage or voiceMessage
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty()
  @Matches(
    `^${Object.values(MessageType)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  messageType: MessageType;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(
    `^${Object.values(MediaType)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  mediaType?: MediaType;
}
