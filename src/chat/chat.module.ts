import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, PrismaService, JwtService, UserService],
})
export class ChatModule {}
