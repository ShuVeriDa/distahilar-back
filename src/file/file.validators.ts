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
    const response = parse(file.buffer);

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
