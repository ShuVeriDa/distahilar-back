import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserStatusService {
  private connectedUsers = new Map<string, number>(); // userId => count of connections
  private server: Server;

  constructor(private readonly prisma: PrismaService) {}

  setServer(server: Server) {
    this.server = server;
  }

  async handleConnection(userId: string): Promise<void> {
    if (!userId) return;

    const count = this.connectedUsers.get(userId) || 0;
    this.connectedUsers.set(userId, count + 1);

    // Обновляем статус только при первом подключении
    if (count === 0) {
      const updatedUser = await this.updateOnlineStatus(true, userId);
      await this.emitUserStatusUpdate(
        userId,
        updatedUser.isOnline,
        updatedUser.lastSeen,
      );
    }
  }

  async handleDisconnect(userId: string): Promise<void> {
    if (!userId) return;

    const count = this.connectedUsers.get(userId) || 0;
    if (count <= 1) {
      this.connectedUsers.delete(userId);
      const updatedUser = await this.updateOnlineStatus(false, userId);
      await this.emitUserStatusUpdate(
        userId,
        updatedUser.isOnline,
        updatedUser.lastSeen,
      );
    } else {
      this.connectedUsers.set(userId, count - 1);
    }
  }

  private async updateOnlineStatus(isOnline: boolean, userId: string) {
    const lastSeen = isOnline ? null : new Date();
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastSeen,
      },
    });
  }

  private async emitUserStatusUpdate(
    userId: string,
    isOnline: boolean,
    lastSeen: Date | null,
  ) {
    if (!this.server) {
      console.warn('WebSocket server not initialized in UserStatusService');
      return;
    }

    // Получаем всех пользователей, которым нужно отправить обновление статуса
    // Это пользователи, которые имеют этого пользователя в контактах или в чатах
    const userChats = await this.prisma.chatMember.findMany({
      where: {
        chat: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const userContacts = await this.prisma.contact.findMany({
      where: {
        OR: [{ savedContactId: userId }, { contactSaverId: userId }],
      },
      select: {
        savedContactId: true,
        contactSaverId: true,
      },
    });

    const relatedUserIds = new Set<string>();

    // Добавляем ID участников чатов
    userChats.forEach((chatMember) => {
      if (chatMember.userId !== userId) {
        relatedUserIds.add(chatMember.userId);
      }
    });

    // Добавляем ID контактов
    userContacts.forEach((contact) => {
      if (contact.savedContactId === userId) {
        relatedUserIds.add(contact.contactSaverId);
      } else if (contact.contactSaverId === userId) {
        relatedUserIds.add(contact.savedContactId);
      }
    });

    // Отправляем событие самому пользователю
    relatedUserIds.add(userId);

    const statusUpdate = {
      userId,
      isOnline,
      lastSeen: lastSeen ? lastSeen.toISOString() : null,
    };

    // Отправляем событие всем заинтересованным пользователям
    relatedUserIds.forEach((relatedUserId) => {
      this.server.emit(`user:${relatedUserId}:statusUpdate`, statusUpdate);
    });
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  getConnectionCountForUser(userId: string): number {
    return this.connectedUsers.get(userId) || 0;
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
