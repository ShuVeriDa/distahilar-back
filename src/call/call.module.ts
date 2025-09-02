import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { CallGateway } from './call.gateway';
import { CallService } from './call.service';

@Module({
  controllers: [],
  providers: [CallService, PrismaService, CallGateway, JwtService],
})
export class CallModule {}
