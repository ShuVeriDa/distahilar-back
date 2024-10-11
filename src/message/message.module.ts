import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { MessageGateway } from './message.gateway';
import { MessageService } from './message.service';

@Module({
  providers: [
    MessageGateway,
    MessageService,
    PrismaService,
    ChatService,
    UserService,
    JwtService,
  ],
})
export class MessageModule {}
