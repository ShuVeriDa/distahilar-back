import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole, MessageStatus } from '@prisma/client';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/prisma.service';
import { ChatToFolderDto } from './dto/chat-to-folder.dto';
import { CreateFolderDto } from './dto/create.dto';
import { UpdateFolderDto } from './dto/update.dto';

@Injectable()
export class FolderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async fetchFolders(userId: string) {
    const folders = await this.prisma.folder.findMany({
      where: {
        userId: userId,
      },
      include: {
        chats: {
          include: {
            messages: {
              include: {
                user: true,
              },
            },
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return folders.map((folder) => {
      return {
        ...folder,
        chats: folder.chats.map((chat) => {
          const member = chat.members.find((m) => m.userId !== userId);
          const memberName = member?.user.name;
          const isDialog = chat.type === ChatRole.DIALOG;

          const chatName = isDialog ? memberName : chat.name;
          const imageUrl = isDialog ? member.user.imageUrl : chat.imageUrl;
          const lengthUnread = chat.messages.filter(
            (obj) => obj.userId === userId && obj.status !== MessageStatus.READ,
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
        }),
      };
    });
  }

  async getFolderById(folderId: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: userId,
      },
      include: {
        chats: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return folder;
  }

  async getFolderByName(folderName: string, userId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: {
        name: folderName,
        userId: userId,
      },
    });

    return folder;
  }

  async createFolder(dto: CreateFolderDto, userId: string) {
    const folderExists = await this.getFolderByName(dto.name, userId);

    if (folderExists) {
      throw new ConflictException('Folder already exists');
    }

    const folder = await this.prisma.folder.create({
      data: {
        name: dto.name,
        userId: userId,
        imageUrl: dto.imageUrl,
        chats: {
          connect: dto.chatIds.map((chatId) => ({
            id: chatId,
          })),
        },
      },
      include: {
        chats: true,
      },
    });

    return folder;
  }

  async updateFolder(dto: UpdateFolderDto, folderId: string, userId: string) {
    const folder = await this.getFolderById(folderId, userId);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    const updatedFolder = await this.prisma.folder.update({
      where: {
        id: folderId,
        userId: userId,
        NOT: {
          name: 'All Chats',
        },
      },
      data: {
        name: dto.name,
        imageUrl: dto.imageUrl,
      },
      include: {
        chats: true,
      },
    });

    return updatedFolder;
  }

  async addChatToFolder(dto: ChatToFolderDto, userId: string) {
    const folder = await this.getFolderById(dto.folderId, userId);

    await this.prisma.folder.update({
      where: {
        id: folder.id,
        userId: userId,
      },
      data: {
        chats: {
          connect: dto.chatIds.map((chatId) => ({
            id: chatId,
          })),
        },
      },
      include: {
        chats: true,
      },
    });

    return 'Chats have been added to folder successfully';
  }

  async removeChatToFolder(dto: ChatToFolderDto, userId: string) {
    const folder = await this.getFolderById(dto.folderId, userId);

    await this.prisma.folder.update({
      where: {
        id: folder.id,
        userId: userId,
      },
      data: {
        chats: {
          disconnect: dto.chatIds.map((chatId) => ({
            id: chatId,
          })),
        },
      },
      include: {
        chats: true,
      },
    });

    return 'Chat has been removed successfully';
  }

  async deleteFolder(folderId: string, userId: string) {
    const folder = await this.getFolderById(folderId, userId);

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    await this.prisma.folder.delete({
      where: {
        id: folderId,
        userId: userId,
        name: {
          not: 'All Chats',
        },
      },
    });

    return 'Folder has been deleted successfully';
  }
}
