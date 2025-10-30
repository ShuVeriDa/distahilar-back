import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole, MemberRole, MessageStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateChatDto } from './dto/create.dto';
import { DeleteChatDto } from './dto/delete.dto';
import { FetchChatsDto } from './dto/fetch.dto';
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
            deletedAt: null,
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
    // First try to find as DIALOG chat
    let chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        members: {
          some: {
            userId,
            deletedAt: null,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        messages: true,
      },
    });

    // If not found as DIALOG, try other types (GROUP, CHANNEL)
    if (!chat) {
      chat = await this.prisma.chat.findFirst({
        where: {
          id: chatId,
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          messages: true,
        },
      });
    }

    if (!chat) {
      if (chatId) {
        const participant = await this.userService.getUserById(chatId);

        const newChat = await this.createChat(
          {
            username: participant.username,
          },
          userId,
        );

        return newChat;
      }
      throw new NotFoundException('Chat not found');
    }

    // Update readByUsers for messages in this chat
    await this.prisma.message.updateMany({
      where: {
        chatId: chatId,
      },
      data: {
        readByUsers: {
          push: userId,
        },
      },
    });

    return chat;
  }

  async fetchChats(dto: FetchChatsDto, userId: string) {
    const { folder } = dto;
    const user = await this.userService.validateUser(userId);

    const chats = await this.prisma.chat.findMany({
      where: {
        folders: {
          some: {
            name: folder,
          },
        },
        members: {
          some: {
            OR: [
              {
                userId: user.id,
                deletedAt: null,
              },
            ],
          },
        },
      },
      include: {
        folders: true,
        members: {
          include: {
            user: true,
          },
        },
        messages: {
          include: {
            user: true,
            media: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return chats.map((chat) => {
      const member = chat.members.find((m) => m.userId !== userId);
      const memberName = member?.user.name;
      const isDialog = chat.type === ChatRole.DIALOG;

      const chatName = isDialog ? memberName : chat.name;
      const imageUrl = isDialog ? member.user.imageUrl : chat.imageUrl;

      const visibleMessages = chat.messages.filter(
        (msg) => !msg.deletedByUsers?.includes(userId),
      );

      const lengthUnread = visibleMessages.filter(
        (obj) =>
          obj.userId === member?.userId &&
          obj.readByUsers.some((id) => id === userId),
      ).length;

      const lastMessage = visibleMessages[0];

      return {
        imageUrl: imageUrl,
        name: chatName,
        lastMessage: lastMessage || null,
        lastMessageDate: lastMessage?.createdAt || null,
        chatId: chat.id,
        lengthUnread: lengthUnread,
        isOnline: isDialog ? member?.user.isOnline : undefined,
        lastSeen: isDialog ? member?.user.lastSeen : null,
        // isChat: true,
        type: chat.type,
      };
    });
  }

  async searchChatsByQuery(dto: ChatSearchDto, userId: string) {
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
                deletedAt: null,
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
            media: true,
          },
          orderBy: {
            createdAt: 'desc',
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
        (obj) => obj.userId === userId && obj.status !== MessageStatus.READ,
      ).length;

      const lastMessage = chat.messages[0];

      return {
        imageUrl: imageUrl,
        name: chatName,
        lastMessage: lastMessage || null,
        lastMessageDate: lastMessage?.createdAt || null,
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
        members: {
          include: {
            user: true,
          },
        },
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
    const initiator = await this.userService.getUserById(userId);
    const peer = await this.prisma.user.findFirst({
      where: { username: dto.username },
      include: { folders: true },
    });

    if (!peer) throw new NotFoundException('User not found');

    if (peer.id === initiator.id)
      throw new ConflictException('Cannot create dialog with yourself');

    const existingDialog = await this.prisma.chat.findFirst({
      where: {
        type: ChatRole.DIALOG,
        AND: [
          { members: { some: { userId: initiator.id } } },
          { members: { some: { userId: peer.id } } },
        ],
      },
      select: { id: true },
    });

    if (existingDialog) throw new ConflictException('Dialog already exists');

    const userFolderId = initiator.folders[0].id;
    const peerFolder = await this.prisma.folder.findFirst({
      where: { userId: peer.id, name: 'All chats' }, // или folders[0]
      select: { id: true },
    });

    return this.prisma.chat.create({
      data: {
        type: ChatRole.DIALOG,
        name: [initiator.username, peer.username].sort().join('-'),
        link: uuidv4(),
        folders: { connect: [{ id: userFolderId }, { id: peerFolder.id }] },
        members: {
          create: [
            { userId: initiator.id, role: MemberRole.GUEST },
            { userId: peer.id, role: MemberRole.GUEST },
          ],
        },
      },
      include: { members: { include: { user: true } }, messages: true },
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

    if (isMember) throw new ConflictException("You're already a member");

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

  async deleteChat(chatId: string, dto: DeleteChatDto, userId: string) {
    const chat = await this.getChatById(chatId);

    const member = await this.prisma.chatMember.findFirst({
      where: {
        chatId: chatId,
        userId: userId,
      },
    });

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
          id: member.id,
          userId: userId,
          chatId: chatId,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      await this.prisma.message.updateMany({
        where: {
          chatId: chatId,
        },
        data: {
          deletedByUsers: {
            push: userId,
          },
        },
      });
    }

    return 'Chat has been deleted';
  }
}
