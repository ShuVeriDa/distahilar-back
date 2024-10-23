import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { path } from 'app-root-path';
import { PrismaService } from '../prisma.service';
import { CloudinaryConfigService } from './cloudinary.service';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: `${path}/uploads`,
      serveRoot: '/uploads',
    }),
  ],
  controllers: [FileController],
  providers: [
    FileService,
    PrismaService,
    CloudinaryConfigService,
    ConfigService,
  ],
})
export class FileModule {}
