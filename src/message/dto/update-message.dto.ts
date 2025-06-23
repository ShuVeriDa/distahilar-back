import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from '@prisma/client';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty()
  @IsString()
  @IsUUID('4')
  chatId: string;

  @ApiProperty()
  @IsString()
  @IsUUID('4')
  messageId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  //This id for mediaId or videoMessageId or voiceMessageId or fileId
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsUUID('4')
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
