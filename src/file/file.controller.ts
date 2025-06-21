import {
  BadRequestException,
  Controller,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { FileService } from './file.service';
import { CustomUploadFileTypeValidator } from './file.validators';

const MAX_PROFILE_PICTURE_SIZE_IN_BYTES = 2 * 1024 * 1024;
const VALID_UPLOADS_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'video/mp4', // MP4 формат
  'video/avi', // AVI формат
  'video/mpeg', // MPEG формат
  'video/quicktime', // MOV формат
  'video/x-matroska', // MKV формат
  'video/webm', // WebM формат
  'audio/ogg',
  'application/ogg',
  'audio/webm',
  'webm',
];

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10)) // Максимум 10 файлов
  public async uploadFile(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addValidator(
          new CustomUploadFileTypeValidator({
            fileType: VALID_UPLOADS_MIME_TYPES,
          }),
        )
        .addMaxSizeValidator({ maxSize: MAX_PROFILE_PICTURE_SIZE_IN_BYTES })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    console.log({ files });

    try {
      return await this.fileService.saveFiles(files, folder);
    } catch (error) {
      throw new BadRequestException(error.message || 'File upload failed.');
    }
  }
}
