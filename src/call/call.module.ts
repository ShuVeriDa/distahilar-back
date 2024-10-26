import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CallController } from './call.controller';
import { CallService } from './call.service';

@Module({
  controllers: [CallController],
  providers: [CallService, PrismaService],
})
export class CallModule {}
