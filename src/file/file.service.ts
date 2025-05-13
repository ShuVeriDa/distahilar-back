import { Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { CloudinaryConfigService } from './cloudinary.service';

interface CloudinaryAudioResponse extends UploadApiResponse {
  playback_url?: string;
  asset_folder?: string;
  display_name?: string;
  audio: {
    codec: string;
    frequency: number;
    channels: number;
    channel_layout: string;
  };
  is_audio: boolean;
  duration: number;
}

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
  ): Promise<CloudinaryAudioResponse> {
    return new Promise((resolve, reject) => {
      if (!file || !file.buffer) {
        return reject(new Error('Invalid file buffer.'));
      }

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
  ): Promise<{ url: string; size: number; duration?: number }> {
    const result = await this.uploadToCloudinary(file, folder);

    return {
      url: result.secure_url,
      size: result.bytes,
      duration: result?.duration,
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
