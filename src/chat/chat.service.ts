import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole, MemberRole } from '@prisma/client';
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

  async getChatById(chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
      },
      include: {
        members: true,
      },
    });

    if (!chat) throw new NotFoundException('Chat not found');

    return chat;
  }

  async getChatByLink(link: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        link: link,
      },
      include: {
        members: true,
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

    const folderId = user.folders[0].id;

    return this.prisma.chat.create({
      data: {
        name: chatName,
        type: ChatRole.DIALOG,
        link: uuidv4(),
        folders: {
          connect: {
            id: folderId,
          },
        },
        members: {
          create: [
            { userId: user.id, role: MemberRole.GUEST },
            { userId: member.id, role: MemberRole.GUEST },
          ],
        },
      },
      include: {
        members: true,
        messages: true,
      },
    });
  }

  async joinChat(link: string, userId: string) {
    const chat = await this.getChatByLink(link);

    if (chat.type === ChatRole.DIALOG) {
      throw new ForbiddenException('This action is not allowed');
    }

    const isMember = chat.members.some((member) => member.userId === userId);

    if (isMember) throw new ForbiddenException("You're already a member");

    return this.prisma.chat.update({
      where: {
        id: chat.id,
        link: chat.link,
      },
      data: {
        members: {
          create: {
            userId,
            role: MemberRole.GUEST,
          },
        },
      },
      include: {
        members: true,
        messages: true,
      },
    });
  }

  async refreshLink(communityId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: communityId,
        members: {
          some: {
            userId,
            role: MemberRole.OWNER,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!chat)
      throw new NotFoundException("Chat not found or You don't have rights");

    if (chat.type === ChatRole.DIALOG) {
      throw new ForbiddenException('This action is not allowed');
    }

    const isOwner =
      chat.members.find((member) => member.userId === userId).role ===
      MemberRole.OWNER;

    if (!isOwner) throw new NotFoundException("You don't have rights");

    return this.prisma.chat.update({
      where: {
        id: chat.id,
      },
      data: {
        link: uuidv4(),
      },
    });
  }

  async deleteChat(dto: DeleteChatDto, chatId: string, userId: string) {
    const chat = await this.getChatById(chatId);

    if (chat.type !== ChatRole.DIALOG) {
      throw new ForbiddenException('This action is not allowed');
    }

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
          id: dto.memberId,
          userId: userId,
          chatId: chatId,
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    return 'Chat has been deleted';
  }
}
