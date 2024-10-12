import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty()
  @IsString()
  chatId: string;

  @ApiProperty()
  @IsString()
  messageId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  //This id for mediaId or videoMessageId or voiceMessageId or fileId
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
