import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateChatDto } from './dto/create.dto';
import { DeleteChatDto } from './dto/delete.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async getChats(userId: string) {
    return await this.prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
        messages: true,
      },
    });
  }

  async getChat(chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
      },
    });

    if (!chat) throw new NotFoundException('Chat not found');

    return chat;
  }

  async createChat(dto: CreateChatDto, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        AND: [
          {
            members: {
              some: {
                user: {
                  username: dto.username,
                },
              },
            },
          },
          {
            members: {
              some: {
                user: {
                  id: userId,
                },
              },
            },
          },
        ],
      },
      include: {
        members: true,
      },
    });

    if (chat) throw new ForbiddenException('Chat already exists');
    const user = await this.userService.getById(userId);

    const member = await this.userService.getByUserName(dto.username);
    if (!member) throw new NotFoundException('User not found');

    const chatName = `${user.username}-${member.username}`;

    return this.prisma.chat.create({
      data: {
        name: chatName,
        type: ChatRole.DIALOG,
        link: uuidv4(),
        folder: {
          connect: {
            userId: userId,
          },
        },
        members: {
          create: [{ userId: userId }, { userId: member.id }],
        },
      },
      include: {
        members: true,
        messages: true,
      },
    });

    // if (dto.type === ChatRole.GROUP) {
    //   return await this.prisma.chat.create({
    //     data: {
    //       name: dto.name,
    //       type: dto.type,
    //       link: uuidv4(),
    //       members: {
    //         create: [{ userId: userId }],
    //       },
    //     },
    //     include: {
    //       members: true,
    //       messages: true,
    //     },
    //   });
    // }
  }

  async deleteChat(dto: DeleteChatDto, chatId: string, userId: string) {
    const chat = await this.getChat(chatId);

    if (chat.type === ChatRole.DIALOG) {
      if (dto.delete_both) {
        await this.prisma.chat.delete({
          where: {
            id: chatId,
          },
        });
      }

      if (!dto.delete_both) {
        await this.prisma.chatMember.update({
          where: {
            userId: userId,
            chatId: chatId,
          },
          data: {
            deletedAt: new Date(),
          },
        });
      }

      return 'Chat has been deleted';
    } else {
      throw new ForbiddenException('This action is not allowed');
    }
  }
}
