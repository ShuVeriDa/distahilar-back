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
    options?: { compress?: boolean },
  ): Promise<CloudinaryAudioResponse> {
    return new Promise((resolve, reject) => {
      console.log({ file });

      if (!file || !file.buffer) {
        return reject(new Error('Invalid file buffer.'));
      }

      // Определяем тип файла для применения соответствующих параметров сжатия
      const mimeType = file.mimetype.toLowerCase();
      const isImage = mimeType.startsWith('image/');
      const isVideo = mimeType.startsWith('video/');
      const isAudio = mimeType.startsWith('audio/');

      // Базовые параметры загрузки
      const uploadOptions: any = {
        folder,
        resource_type: 'auto',
      };

      // Применяем параметры сжатия и оптимизации, если включено
      if (options?.compress !== false) {
        if (isImage) {
          // Автоматическое сжатие и оптимизация изображений
          uploadOptions.quality = 'auto:good'; // auto:good - баланс между качеством и размером
          uploadOptions.fetch_format = 'auto'; // Автоматический выбор формата (WebP для браузеров, которые поддерживают)
        } else if (isVideo) {
          // Параметры оптимизации видео
          uploadOptions.eager_async = true; // Асинхронная обработка
          uploadOptions.eager = [
            // Автоматическая оптимизация видео
            {
              quality: 'auto:good',
              video_codec: 'auto',
              audio_codec: 'auto',
            },
          ];
        }
        // Для аудио и других файлов Cloudinary применяет базовую оптимизацию автоматически
      }

      this.cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return reject(new Error(`Cloudinary error: ${error.message}`));
          }
          resolve(result);
        })
        .end(file.buffer); // Отправляем буфер файла
    });
  }

  async saveFiles(
    files: Express.Multer.File[],
    folder = 'default',
    options?: { compress?: boolean },
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
      const result = await this.uploadToCloudinary(file, folder, options);
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

  async deleteFromCloudinaryByUrl(url?: string): Promise<void> {
    if (!url) {
      return;
    }

    const resource = this.extractCloudinaryResource(url);

    if (!resource) {
      console.warn('Cloudinary deletion skipped. Unable to parse URL:', url);
      return;
    }

    const { publicId, resourceType } = resource;

    try {
      await this.cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
    }
  }

  private extractCloudinaryResource(
    url: string,
  ): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
    if (!url.includes('res.cloudinary.com')) {
      return null;
    }

    const cloudinaryHost = 'res.cloudinary.com/';
    const hostIndex = url.indexOf(cloudinaryHost);

    if (hostIndex === -1) {
      return null;
    }

    const pathAfterHost = url.slice(hostIndex + cloudinaryHost.length);
    const segments = pathAfterHost.split('/').filter(Boolean);

    if (segments.length < 4) {
      return null;
    }

    const [, resourceTypeCandidate, uploadKeyword, ...rest] = segments;

    if (uploadKeyword !== 'upload' || rest.length === 0) {
      return null;
    }

    const versionIndex = rest.findIndex((segment) => /^v\d+$/i.test(segment));
    const publicIdSegments =
      versionIndex >= 0 ? rest.slice(versionIndex + 1) : rest;

    if (publicIdSegments.length === 0) {
      return null;
    }

    const lastSegmentIndex = publicIdSegments.length - 1;
    const lastSegment = publicIdSegments[lastSegmentIndex];
    const dotIndex = lastSegment.lastIndexOf('.');

    if (dotIndex !== -1) {
      publicIdSegments[lastSegmentIndex] = lastSegment.slice(0, dotIndex);
    }

    const publicId = publicIdSegments.join('/');

    const resourceType =
      resourceTypeCandidate === 'video'
        ? 'video'
        : resourceTypeCandidate === 'raw'
          ? 'raw'
          : 'image';

    if (!publicId) {
      return null;
    }

    return { publicId, resourceType };
  }
}
