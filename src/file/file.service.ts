import { Injectable } from '@nestjs/common';
import { path } from 'app-root-path';
import { ensureDir, writeFile } from 'fs-extra';

@Injectable()
export class FileService {
  async saveFiles(
    file: Express.Multer.File,
    folder = 'default',
  ): Promise<{ url: string }> {
    const uploadFolder = `${path}/uploads/${folder}`;

    await ensureDir(uploadFolder); // проверяет наличии папки, если она отсутствует, то создает ее.

    await writeFile(`${uploadFolder}/${file.originalname}`, file.buffer);

    return {
      url: `/uploads/${folder}/${file.originalname}`,
    };
  }
}
