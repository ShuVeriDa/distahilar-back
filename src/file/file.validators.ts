import { FileValidator } from '@nestjs/common';
import { parse } from 'file-type-mime';

export interface CustomUploadTypeValidatorOptions {
  fileType: string[];
}

export class CustomUploadFileTypeValidator extends FileValidator {
  private _allowedMimeTypes: string[];

  constructor(
    protected readonly validationOptions: CustomUploadTypeValidatorOptions,
  ) {
    super(validationOptions);
    this._allowedMimeTypes = this.validationOptions.fileType;
  }

  public isValid(file?: Express.Multer.File): boolean {
    const ab = new Uint8Array(file.buffer).buffer;
    const response = parse(ab);

    if (file.mimetype === 'audio/webm' || file.mimetype === 'video/webm') {
      return this._allowedMimeTypes.includes(file.mimetype);
    }

    return this._allowedMimeTypes.includes(response.mime);
  }

  public buildErrorMessage(): string {
    return `Upload not allowed. Upload only files of type: ${this._allowedMimeTypes.join(
      ', ',
    )}`;
  }
}

// Ограничения размера файлов согласно плану Cloudinary подписки
const MAX_IMAGE_SIZE_IN_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE_IN_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_RAW_FILE_SIZE_IN_BYTES = 10 * 1024 * 1024; // 10 MB

export interface CustomUploadFileSizeValidatorOptions {
  imageMaxSize?: number;
  videoMaxSize?: number;
  rawMaxSize?: number;
}

export class CustomUploadFileSizeValidator extends FileValidator<CustomUploadFileSizeValidatorOptions> {
  private imageMaxSize: number;
  private videoMaxSize: number;
  private rawMaxSize: number;

  constructor(
    protected readonly validationOptions: CustomUploadFileSizeValidatorOptions = {},
  ) {
    super(validationOptions);
    this.imageMaxSize =
      validationOptions?.imageMaxSize || MAX_IMAGE_SIZE_IN_BYTES;
    this.videoMaxSize =
      validationOptions?.videoMaxSize || MAX_VIDEO_SIZE_IN_BYTES;
    this.rawMaxSize =
      validationOptions?.rawMaxSize || MAX_RAW_FILE_SIZE_IN_BYTES;
  }

  public isValid(file?: Express.Multer.File): boolean {
    if (!file || !file.size) {
      return false;
    }

    const mimeType = file.mimetype.toLowerCase();

    // Проверка для изображений
    if (mimeType.startsWith('image/')) {
      return file.size <= this.imageMaxSize;
    }

    // Проверка для видео
    if (mimeType.startsWith('video/')) {
      return file.size <= this.videoMaxSize;
    }

    // Проверка для всех остальных файлов (raw, документы, архивы, аудио и т.д.)
    return file.size <= this.rawMaxSize;
  }

  public buildErrorMessage(): string {
    return `File size exceeds the maximum allowed size. Maximum sizes: Images - ${this.imageMaxSize / (1024 * 1024)}MB, Videos - ${this.videoMaxSize / (1024 * 1024)}MB, Other files - ${this.rawMaxSize / (1024 * 1024)}MB`;
  }
}
