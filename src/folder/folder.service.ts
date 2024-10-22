import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
        chats: true,
      },
    });

    return folders;
  }

  async getFolderById(folderId: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({
      where: {
        id: folderId,
        userId: userId,
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
      },
      include: {
        chats: true,
      },
    });

    return updatedFolder;
  }

  async addChatToFolder(dto: ChatToFolderDto, userId: string) {
    const folder = await this.getFolderById(dto.folderId, userId);

    const folderChat = await this.prisma.folder.update({
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

    return folderChat;
  }

  async removeChatToFolder(dto: ChatToFolderDto, userId: string) {
    const folder = await this.getFolderById(dto.folderId, userId);

    const folderChat = await this.prisma.folder.update({
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

    return folderChat;
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
