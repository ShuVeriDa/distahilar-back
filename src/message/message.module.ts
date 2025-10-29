import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from 'src/chat/chat.service';
import { FolderService } from 'src/folder/folder.service';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { MessageGateway } from './message.gateway';
import { MessageService } from './message.service';
import { ReactionService } from './reaction.service';

@Module({
  imports: [UserModule],
  providers: [
    MessageGateway,
    MessageService,
    PrismaService,
    ChatService,
    UserService,
    JwtService,
    ReactionService,
    FolderService,
  ],
})
export class MessageModule {}
