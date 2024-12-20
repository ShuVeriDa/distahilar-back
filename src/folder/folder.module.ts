import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { FolderController } from './folder.controller';
import { FolderGateway } from './folder.gateway';
import { FolderService } from './folder.service';

@Module({
  controllers: [FolderController],
  providers: [
    FolderService,
    PrismaService,
    ChatService,
    UserService,
    FolderGateway,
    JwtService,
  ],
})
export class FolderModule {}
