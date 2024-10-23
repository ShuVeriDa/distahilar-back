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
      this.cloudinary.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(file.buffer);
    });
  }

  async saveFiles(
    file: Express.Multer.File,
    folder = 'default',
  ): Promise<{ url: string }> {
    const result = await this.uploadToCloudinary(file, folder);
    return {
      url: result.secure_url,
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
