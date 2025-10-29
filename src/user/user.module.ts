import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { UserStatusService } from './user-status.service';
import { UserController } from './user.controller';
import { UserGateway } from './user.gateway';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    PrismaService,
    UserGateway,
    JwtService,
    UserStatusService,
  ],
  exports: [UserStatusService],
})
export class UserModule {}
