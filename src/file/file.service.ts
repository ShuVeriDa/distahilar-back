import { Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryConfigService } from './cloudinary.service';

@Injectable()
export class FileService {
  constructor(
    private readonly cloudinaryConfigService: CloudinaryConfigService,
  ) {
    this.cloudinary = this.cloudinaryConfigService.getCloudinaryInstance();
  }

  private cloudinary;

  async uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!file || !file.buffer) {
        return reject(new Error('Invalid file buffer.'));
      }

      // Логирование файла для отладки
      console.log('Uploading file:', {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });

      this.cloudinary.uploader
        .upload_stream(
          { folder, resource_type: 'auto' }, // Добавлено resource_type: 'auto'
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return reject(new Error(`Cloudinary error: ${error.message}`));
            }
            resolve(result);
          },
        )
        .end(file.buffer); // Отправляем буфер файла
    });
  }

  async saveFiles(
    file: Express.Multer.File,
    folder = 'default',
  ): Promise<{ url: string; size: number }> {
    const result = await this.uploadToCloudinary(file, folder);
    console.log('result', result);
    console.log('file', file);

    return {
      url: result.secure_url,
      size: result.bytes,
    };
  }

  // async saveFiles(
  //   file: Express.Multer.File,
  //   folder = 'default',
  // ): Promise<{ url: string }> {
  //   const uploadFolder = `${path}/uploads/${folder}`;

  //   await ensureDir(uploadFolder); // проверяет наличии папки, если она отсутствует, то создает ее.

  //   await writeFile(`${uploadFolder}/${file.originalname}`, file.buffer);

  //   return {
  //     url: `/uploads/${folder}/${file.originalname}`,
  //   };
  // }
}
