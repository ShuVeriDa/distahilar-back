import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole, MemberRole, Message, MessageType } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { FetchMessageDto } from './dto/fetch-message.dto';
import { PinMessageDto } from './dto/pin-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {
  MESSAGES_BATCH = 15;
  constructor(private prisma: PrismaService) {}

  async getMessages(dto: FetchMessageDto, userId: string) {
    const chat = await this.validateChat(dto.chatId);

    const isDialog = chat.type === 'DIALOG';
    const isMember = chat.members.some((member) => member.userId === userId);

    let messages: Message[] = [];

    if (isDialog && isMember) {
      messages = await this.messagesForDialog(dto.cursor, chat.id, userId);
    } else {
      messages = await this.messagesForOtherChats(dto.cursor, chat.id);
    }

    let nextCursor = null;

    if (messages.length === this.MESSAGES_BATCH) {
      nextCursor = messages[this.MESSAGES_BATCH - 1].id;
    }

    return { messages, chatId: chat.id, nextCursor };
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
      },
    });
    if (!message) throw new NotFoundException('Message or Chat not found');
    return message;
  }

  async createMessage(dto: CreateMessageDto, userId: string) {
    if (!dto.content || !dto.chatId)
      throw new NotFoundException('Content or ChatId not found');

    const chat = await this.validateChat(dto.chatId);

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

  async deleteMessage(dto: DeleteMessageDto, userId: string) {
    const { chat, message, isMessageOwner, isModerator, isAdmin, isOwner } =
      await this.validateMessage(dto.chatId, dto.messageId, userId);

    if (chat.type === ChatRole.DIALOG) {
      return await this.deleteMessageForOwnerMessage(
        dto.delete_both,
        isMessageOwner,
        message.id,
        chat.id,
        userId,
      );
    } else {
      if (!isMessageOwner && !isModerator && !isAdmin && !isOwner) {
        throw new ForbiddenException(
          "You don't have permission to delete this message",
        );
      }

      if (isMessageOwner) {
        return await this.deleteMessageForOwnerMessage(
          dto.delete_both,
          isMessageOwner,
          message.id,
          chat.id,
          userId,
        );
      }

      if (isOwner || isAdmin || isModerator) {
        return await this.prisma.message.delete({
          where: {
            id: message.id,
            chatId: chat.id,
            chat: {
              members: {
                some: {
                  role:
                    MemberRole.OWNER ||
                    MemberRole.ADMIN ||
                    MemberRole.MODERATOR,
                },
              },
            },
          },
          include: {
            chat: true,
          },
        });
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
          chat: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      return await this.prisma.message.findMany({
        take: this.MESSAGES_BATCH,
        where: { chatId: chatId },
        include: {
          chat: true,
        },
        orderBy: {
          createdAt: 'desc',
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
        },
        orderBy: {
          createdAt: 'desc',
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
        },
        orderBy: {
          createdAt: 'desc',
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
    const member = chat.members.find((member) => member.userId === userId);

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
    messageId: string,
    chatId: string,
    userId: string,
  ) {
    if (delete_both && isMessageOwner) {
      return await this.prisma.message.delete({
        where: {
          id: messageId,
          chatId: chatId,
          userId: userId,
        },
        include: {
          chat: true,
        },
      });
    } else {
      return await this.prisma.message.update({
        where: {
          id: messageId,
          chatId: chatId,
        },
        data: {
          deletedByUsers: {
            push: userId,
          },
        },
        include: {
          chat: true,
        },
      });
    }
  }
}
