import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    chatService: ChatService,
    userService: UserService,
  ) {}

  async createMessage(dto: CreateMessageDto, userId: string) {
    if (!dto.content || !dto.chatId)
      throw new NotFoundException('Content or ChatId not found');

    const chat = await this.validateChat(dto.chatId, userId);

    if (dto.messageType === MessageType.TEXT) {
      return await this.prisma.message.create({
        data: {
          content: dto.content,
          chat: {
            connect: {
              id: chat.id,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          messageType: dto.messageType,
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    } else if (dto.messageType === MessageType.VIDEO) {
      return await this.prisma.message.create({
        data: {
          content: dto.content,
          chat: {
            connect: {
              id: chat.id,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          messageType: dto.messageType,
          videoMessages: {
            create: {
              url: dto.url,
              duration: dto.duration,
            },
          },
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    } else if (dto.messageType === MessageType.FILE) {
      return await this.prisma.message.create({
        data: {
          content: dto.content,
          chat: {
            connect: {
              id: chat.id,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          messageType: dto.messageType,
          media: {
            create: {
              type: dto.mediaType,
              url: dto.url,
            },
          },
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    } else {
      return await this.prisma.message.create({
        data: {
          content: dto.content,
          chat: {
            connect: {
              id: chat.id,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          messageType: dto.messageType,
          voiceMessages: {
            create: {
              url: dto.url,
              duration: dto.duration,
            },
          },
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    }
  }

  private async validateChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            chatId: chatId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!chat) throw new NotFoundException('Chat or Member not found');

    return chat;
  }
}
