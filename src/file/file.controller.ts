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
import {
  CustomUploadFileSizeValidator,
  CustomUploadFileTypeValidator,
} from './file.validators';

const VALID_UPLOADS_MIME_TYPES = [
  // Изображения
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp', // WebP формат
  'image/svg+xml', // SVG векторная графика
  'image/bmp', // BMP растровые изображения
  'image/tiff', // TIFF высококачественные изображения
  'image/x-icon', // ICO иконки

  // Видео
  'video/mp4', // MP4 формат
  'video/avi', // AVI формат
  'video/mpeg', // MPEG формат
  'video/quicktime', // MOV формат
  'video/x-matroska', // MKV формат
  'video/webm', // WebM формат
  'video/x-ms-wmv', // WMV формат
  'video/x-flv', // FLV формат
  'video/3gpp', // 3GP мобильное видео

  // Аудио
  'audio/ogg',
  'application/ogg',
  'audio/webm',
  'audio/mpeg', // MP3 и другие MPEG аудио
  'audio/mp3', // MP3 формат
  'audio/wav', // WAV несжатый аудио
  'audio/aac', // AAC сжатый аудио
  'audio/flac', // FLAC lossless аудио
  'audio/mp4', // M4A iTunes аудио

  // Документы
  'application/pdf',
  'text/plain', // TXT файлы
  'application/rtf', // RTF документы
  'application/msword', // DOC файлы
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX файлы
  'application/vnd.ms-excel', // XLS файлы
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX файлы
  'application/vnd.ms-powerpoint', // PPT файлы
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX файлы

  // Архивы
  'application/zip', // ZIP архивы
  'application/vnd.rar', // RAR архивы
  'application/x-7z-compressed', // 7Z архивы
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
        .addValidator(new CustomUploadFileSizeValidator())
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    files: Express.Multer.File[],
    @Query('folder') folder?: string,
    @Query('compress') compress?: string,
  ) {
    console.log({ files });

    try {
      // Парсим параметр compress (по умолчанию включено сжатие)
      const shouldCompress = compress === 'false' ? false : true;

      return await this.fileService.saveFiles(files, folder, {
        compress: shouldCompress,
      });
    } catch (error) {
      throw new BadRequestException(error.message || 'File upload failed.');
    }
  }
}
