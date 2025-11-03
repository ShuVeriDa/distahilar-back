import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { FolderController } from './folder.controller';
import { FolderGateway } from './folder.gateway';
import { FolderService } from './folder.service';

@Module({
  imports: [UserModule],
  controllers: [FolderController],
  providers: [
    FolderService,
    PrismaService,
    ChatService,
    UserService,
    FolderGateway,
    JwtService,
    ConfigService,
  ],
})
export class FolderModule {}
