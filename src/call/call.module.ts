import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/user/user.module';
import { CallGateway } from './call.gateway';
import { CallService } from './call.service';

@Module({
  imports: [UserModule],
  controllers: [],
  providers: [CallService, PrismaService, CallGateway, JwtService],
})
export class CallModule {}
