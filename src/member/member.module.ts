import { Module } from '@nestjs/common';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';

@Module({
  controllers: [MemberController],
  providers: [MemberService, PrismaService, ChatService, UserService],
})
export class MemberModule {}
