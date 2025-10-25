import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChatRole,
  MemberRole,
  Message,
  MessageStatus,
  MessageType,
  Prisma,
} from '@prisma/client';
import { FolderService } from 'src/folder/folder.service';
import { PrismaService } from 'src/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { FetchMessageDto } from './dto/fetch-message.dto';
import { PinMessageDto } from './dto/pin-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {
  MESSAGES_BATCH = 100;
  constructor(
    private prisma: PrismaService,
    private readonly folderService: FolderService,
  ) {}

  async getMessages(dto: FetchMessageDto, userId: string) {
    const chat = await this.validateChat(dto.chatId);

    const isDialog = chat.type === ChatRole.DIALOG;

    const meAsMember = await this.prisma.chatMember.findFirst({
      where: {
        chatId: chat.id,
        userId: userId,
      },
    });

    const updates = await this.markAsRead(chat.id, userId);

    let messages: Message[] = [];

    if (isDialog && meAsMember) {
      messages = await this.messagesForDialog(dto.cursor, chat.id, userId);
    } else {
      messages = await this.messagesForOtherChats(dto.cursor, chat.id);
    }

    let nextCursor = null;

    if (messages.length === this.MESSAGES_BATCH) {
      nextCursor = messages[this.MESSAGES_BATCH - 1].id;
    }

    return { messages, chatId: chat.id, nextCursor, updates };
  }

  async getMessage(chatId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        chatId: chatId,
      },
      include: {
        media: true,
        videoMessages: true,
        voiceMessages: true,
        reactions: true,
        chat: true,
      },
    });
    if (!message) throw new NotFoundException('Message or Chat not found');
    return message;
  }

  async createMessage(dto: CreateMessageDto, userId: string) {
    if (!dto.chatId) throw new NotFoundException('Content or ChatId not found');

    const chat = await this.validateChat(dto.chatId);

    let message: Message;

    const isChatExistInFolder = await this.prisma.chat.findFirst({
      where: {
        id: chat.id,
        folders: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!isChatExistInFolder) {
      const folders = await this.folderService.fetchFolders(userId);

      const allFolder = folders.find((f) => f.name === 'All chats');

      await this.prisma.folder.update({
        where: {
          id: allFolder.id,
          userId: userId,
        },
        data: {
          chats: {
            connect: {
              id: chat.id,
            },
          },
        },
        include: {
          chats: true,
        },
      });
    }

    if (dto.messageType === MessageType.TEXT) {
      message = await this.prisma.message.create({
        data: {
          content: dto.content,
          status: MessageStatus.PENDING,
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
          readByUsers: {
            set: [userId],
          },
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    } else if (dto.messageType === MessageType.VIDEO) {
      message = await this.prisma.message.create({
        data: {
          content: dto.content,
          status: MessageStatus.PENDING,
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
              size: dto.size,
              duration: dto.duration,
            },
          },
          readByUsers: {
            set: [userId],
          },
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    } else if (dto.messageType === MessageType.FILE) {
      message = await this.prisma.message.create({
        data: {
          content: dto.content,
          status: MessageStatus.PENDING,
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
              size: dto.size,
              name: dto.name,
            },
          },
          readByUsers: {
            set: [userId],
          },
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    } else {
      message = await this.prisma.message.create({
        data: {
          content: dto.content,
          status: MessageStatus.PENDING,
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
              size: dto.size,
              duration: dto.duration,
            },
          },
          readByUsers: {
            set: [userId],
          },
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    }

    await this.prisma.message.update({
      where: {
        id: message.id,
        chatId: chat.id,
        userId: userId,
      },
      data: {
        status: MessageStatus.SENT,
      },
    });

    return message;
  }

  async editMessage(dto: UpdateMessageDto, userId: string) {
    const { chat, message, isMessageOwner } = await this.validateMessage(
      dto.chatId,
      dto.messageId,
      userId,
    );

    if (!isMessageOwner)
      throw new ForbiddenException(
        "You don't have permission to edit this message",
      );

    if (message.messageType === MessageType.TEXT) {
      return await this.prisma.message.update({
        where: {
          id: message.id,
          chatId: chat.id,
        },
        data: {
          content: dto.content,
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    } else if (message.messageType === MessageType.VIDEO) {
      return await this.prisma.message.update({
        where: {
          id: message.id,
          chatId: chat.id,
        },
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
          videoMessages: {
            update: {
              where: {
                id: dto.mediaId,
              },
              data: {
                url: dto.url,
                duration: dto.duration,
              },
            },
          },
        },
        include: {
          media: true,
          videoMessages: true,
          voiceMessages: true,
        },
      });
    } else if (message.messageType === MessageType.FILE) {
      return await this.prisma.message.update({
        where: {
          id: message.id,
          chatId: chat.id,
        },
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
          media: {
            update: {
              where: {
                id: dto.mediaId,
              },
              data: {
                url: dto.url,
              },
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
      return await this.prisma.message.update({
        where: {
          id: message.id,
          chatId: chat.id,
        },
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
          voiceMessages: {
            update: {
              where: {
                id: dto.mediaId,
              },
              data: {
                url: dto.url,
                duration: dto.duration,
              },
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

  async markAsRead(
    chatId: string,
    userId: string,
  ): Promise<Prisma.BatchPayload> {
    const result = await this.prisma.message.updateMany({
      where: {
        chatId: chatId,
        userId: { not: userId },
        status: { not: MessageStatus.READ },
        NOT: {
          deletedByUsers: {
            has: userId,
          },
          readByUsers: {
            has: userId,
          },
        },
        chat: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      },
      data: {
        status: MessageStatus.READ,
        readByUsers: {
          push: [userId],
        },
      },
    });
    return result;
  }

  async deleteMessage(dto: DeleteMessageDto, userId: string) {
    const { chat, message, isMessageOwner, isModerator, isAdmin, isOwner } =
      await this.validateMessage(dto.chatId, dto.messageIds[0], userId);

    if (chat.type === ChatRole.DIALOG) {
      await this.deleteMessageForOwnerMessage(
        dto.delete_both,
        isMessageOwner,
        dto.messageIds,
        chat.id,
        userId,
      );

      return [message];
    } else {
      if (!isMessageOwner && !isModerator && !isAdmin && !isOwner) {
        throw new ForbiddenException(
          "You don't have permission to delete this message",
        );
      }

      if (isMessageOwner) {
        await this.deleteMessageForOwnerMessage(
          dto.delete_both,
          isMessageOwner,
          dto.messageIds,
          chat.id,
          userId,
        );

        return [message];
      }

      if (isOwner || isAdmin || isModerator) {
        await this.prisma.message.deleteMany({
          where: {
            id: {
              in: dto.messageIds,
            },
            chatId: chat.id,
            chat: {
              members: {
                some: {
                  role: {
                    in: [
                      MemberRole.OWNER,
                      MemberRole.ADMIN,
                      MemberRole.MODERATOR,
                    ],
                  },
                },
              },
            },
          },
        });

        return [message];
      }
    }
  }

  //Pin a message

  async pinMessage(dto: PinMessageDto, userId: string) {
    const { chat, message, isModerator, isAdmin, isOwner } =
      await this.validateMessage(dto.chatId, dto.messageId, userId);

    if (chat.type !== ChatRole.DIALOG && !isModerator && !isAdmin && !isOwner) {
      throw new ForbiddenException(
        "You don't have permission to pin this message",
      );
    }

    if (message.isPinned) {
      return await this.prisma.message.update({
        where: {
          id: message.id,
          chatId: chat.id,
        },
        data: {
          isPinned: false,
          pinnedChat: {
            disconnect: true,
          },
        },
      });
    } else {
      const pinnedMessage = await this.prisma.message.findFirst({
        where: {
          isPinned: true,
          chatId: chat.id,
        },
      });
      if (pinnedMessage) {
        await this.prisma.message.update({
          where: {
            id: pinnedMessage.id,
            chatId: chat.id,
          },
          data: {
            isPinned: false,
            pinnedChat: {
              disconnect: true,
            },
          },
        });
      }

      return await this.prisma.message.update({
        where: {
          id: message.id,
          chatId: chat.id,
        },
        data: {
          isPinned: true,
          pinnedChat: {
            connect: {
              id: chat.id,
            },
          },
        },
      });
    }
  }

  //Components
  private async messagesForOtherChats(cursor: string, chatId: string) {
    if (cursor) {
      return await this.prisma.message.findMany({
        take: this.MESSAGES_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: { chatId: chatId },
        include: {
          user: true,
          chat: true,
          media: true,
          reactions: {
            include: {
              users: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    } else {
      return await this.prisma.message.findMany({
        take: this.MESSAGES_BATCH,
        where: { chatId: chatId },
        include: {
          user: true,
          chat: true,
          media: true,
          reactions: {
            include: {
              users: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }
  }

  private async messagesForDialog(
    cursor: string,
    chatId: string,
    userId: string,
  ) {
    if (cursor) {
      return await this.prisma.message.findMany({
        take: this.MESSAGES_BATCH,
        skip: 1,
        cursor: {
          id: cursor,
        },
        where: {
          chatId: chatId,
          AND: [
            {
              NOT: {
                deletedByUsers: {
                  has: userId,
                },
              },
            },
          ],
          chat: {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        },
        include: {
          chat: true,
          videoMessages: true,
          voiceMessages: true,
          media: true,
          user: true,
          reactions: {
            include: {
              users: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    } else {
      return await this.prisma.message.findMany({
        take: this.MESSAGES_BATCH,
        where: {
          chatId: chatId,
          AND: [
            {
              NOT: {
                deletedByUsers: {
                  has: userId,
                },
              },
            },
          ],
          chat: {
            members: {
              some: {
                userId: userId,
              },
            },
          },
        },
        include: {
          chat: true,
          videoMessages: true,
          voiceMessages: true,
          user: true,
          media: true,
          reactions: {
            include: {
              users: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }
  }

  private async validateChat(chatId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
      },
      include: {
        members: true,
        folders: true,
      },
    });

    if (!chat) throw new NotFoundException('Chat or Member not found');

    return chat;
  }

  private async validateMessage(
    chatId: string,
    messageId: string,
    userId: string,
  ) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        chatId: chatId,
        // userId: userId,
      },
      include: {
        media: true,
        videoMessages: true,
        voiceMessages: true,
      },
    });

    if (!message) throw new NotFoundException('The message not found');

    const chat = await this.validateChat(message.chatId);

    const member = await this.prisma.chatMember.findFirst({
      where: {
        chatId: chat.id,
        userId: userId,
      },
    });

    if (!member) throw new NotFoundException('The member not found');

    const isMessageOwner = message.userId === userId;
    const isOwner = member.role === MemberRole.OWNER;
    const isAdmin = member.role === MemberRole.ADMIN;
    const isModerator = member.role === MemberRole.MODERATOR;

    return {
      message,
      chat,
      isMessageOwner,
      isOwner,
      isAdmin,
      isModerator,
    };
  }

  private async deleteMessageForOwnerMessage(
    delete_both: boolean,
    isMessageOwner: boolean,
    messageIds: string[],
    chatId: string,
    userId: string,
  ) {
    if (delete_both && isMessageOwner) {
      await this.prisma.message.deleteMany({
        where: {
          id: {
            in: messageIds,
          },
          chatId: chatId,
          userId: userId,
        },
      });
    } else {
      await this.prisma.message.updateMany({
        where: {
          id: {
            in: messageIds,
          },
          chatId: chatId,
        },
        data: {
          deletedByUsers: {
            push: userId,
          },
        },
      });
    }
  }
}
