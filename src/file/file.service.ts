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
      console.log({ file });

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
    files: Express.Multer.File[],
    folder = 'default',
  ): Promise<
    {
      url: string;
      size: number;
      duration?: number;
      name?: string;
      type?: string;
    }[]
  > {
    const results = [];

    for (const file of files) {
      const result = await this.uploadToCloudinary(file, folder);
      console.log({ file, result });

      results.push({
        url: result.secure_url,
        size: result.bytes,
        duration: result?.duration,
        name: file.originalname,
        type: file.mimetype,
      });
    }

    return results;
  }
}
