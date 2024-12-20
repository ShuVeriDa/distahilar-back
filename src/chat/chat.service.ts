import {
  ConflictException,
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
import { ChatSearchDto } from './dto/search.dto';
import { FoundedChatsType } from './types.type';

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

  async getChat(chatId: string, userId: string) {
    const chat = await this.getChatById(chatId);

    await this.prisma.message.updateMany({
      where: {
        chatId: chatId,
        // readByUsers: { has: userId },
      },
      data: {
        readByUsers: {
          push: userId,
        },
      },
    });

    return chat;
  }

  async getChatByQuery(dto: ChatSearchDto, userId: string) {
    const { name } = dto;
    const user = await this.userService.validateUser(userId);

    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          {
            type: {
              in: [ChatRole.CHANNEL, ChatRole.GROUP],
            },
            name: {
              contains: name,
              mode: 'insensitive',
            },
          },
          {
            type: ChatRole.DIALOG,
            // name: {
            //   contains: name,
            //   mode: 'insensitive',
            // },
            // members: {
            //   some: {
            //     userId: userId,
            //   },
            // },
            members: {
              some: {
                OR: [
                  {
                    user: {
                      name: {
                        contains: name,
                        mode: 'insensitive',
                      },
                    },
                    userId: {
                      not: userId, // Исключаем текущего пользователя
                    },
                  },
                  {
                    user: {
                      username: {
                        contains: name,
                        mode: 'insensitive',
                      },
                    },
                    userId: {
                      not: userId, // Исключаем текущего пользователя
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          include: {
            user: true,
          },
        },
      },
    });

    const chatUserIds = new Set(
      chats.flatMap((chat) => chat.members.map((member) => member.userId)),
    ).add(userId);

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: name, mode: 'insensitive' } },
              { name: { contains: name, mode: 'insensitive' } },
            ],
          },
          {
            id: { notIn: Array.from(chatUserIds) },
          },
        ],
      },
    });

    const chatsResults: FoundedChatsType[] = chats.map((chat) => {
      const member = chat.members.find((m) => m.userId !== user.id);
      const memberName = member?.user.name;
      const isDialog = chat.type === ChatRole.DIALOG;

      const chatName = isDialog ? memberName : chat.name;
      const imageUrl = isDialog ? member.user.imageUrl : chat.imageUrl;
      const lengthUnread = chat.messages.filter(
        (obj) => obj.userId === userId && !obj.isRead,
      ).length;

      return {
        imageUrl: imageUrl,
        name: chatName,
        lastMessage: chat.messages.at(-1) || null,
        lastMessageDate: chat.messages.at(-1)?.createdAt || null,
        chatId: chat.id,
        lengthUnread: lengthUnread,
        isOnline: isDialog ? member?.user.isOnline : undefined,
        lastSeen: isDialog ? member?.user.lastSeen : null,
        // isChat: true,
        type: chat.type,
      };
    });

    const usersResults: FoundedChatsType[] = users.map((user) => {
      return {
        imageUrl: user.imageUrl,
        name: user.name,
        lastMessage: null,
        lastMessageDate: null,
        lengthUnread: null,
        chatId: user.id,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        // isChat: false,
        type: ChatRole.DIALOG,
      };
    });

    const result: FoundedChatsType[] = [...chatsResults, ...usersResults].sort(
      (a, b) => a.name.localeCompare(b.name),
    );

    return result;
  }

  async getChatById(chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
      },
      include: {
        members: true,
        messages: true,
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

    if (chat) throw new ConflictException('Chat already exists');
    const user = await this.userService.getUserById(userId);

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

    const isMember = await this.prisma.chatMember.findFirst({
      where: {
        chatId: chat.id,
        userId: userId,
      },
    });

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

    const member = await this.prisma.chatMember.findFirst({
      where: {
        chatId: chat.id,
        userId: userId,
      },
    });

    const isOwner = member.role === MemberRole.OWNER;

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
