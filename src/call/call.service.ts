import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole, MemberRole } from '@prisma/client';
import { AccessToken, RoomServiceClient, TrackType } from 'livekit-server-sdk';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CallService {
  private roomService: RoomServiceClient;

  constructor(private readonly prisma: PrismaService) {
    const livekitUrl = this.getEnvVariable('LIVEKIT_URL');
    const apiKey = this.getEnvVariable('LIVEKIT_API_KEY');
    const apiSecret = this.getEnvVariable('LIVEKIT_API_SECRET');

    this.roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  }

  async enterCallRoom(roomId: string, userId: string) {
    const { roomName, apiKey, apiSecret, chat, isSuccess } =
      await this.validateRoom(roomId, userId);

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const expiresIn = 60 * 60;
    const expiresAt = Date.now() + expiresIn * 1000;

    const roomObj = {
      identity: user.username,
      name: user.username,
      ttl: expiresAt,
    };

    const generateToken = async (grants: object) => {
      const at = new AccessToken(apiKey, apiSecret, roomObj);
      at.addGrant(grants);
      return await at.toJwt();
    };

    if (chat.type === ChatRole.DIALOG) {
      const rooms = await this.roomService.listRooms([roomName]);
      const roomExists = rooms.length > 0;

      if (!roomExists) {
        await this.createRoom(roomName, 2);
        console.log('Room created successfully');
      } else {
        try {
          const participants =
            await this.roomService.listParticipants(roomName);
          console.log(`Room has ${participants.length} participants`);

          if (participants.length >= 2) {
            const currentUserExists = participants.some(
              (p) => p.identity === user.username,
            );

            if (!currentUserExists) {
              console.log('Room full, cleaning up participants...');
              // Используем cleanupRoom метод
              await this.cleanupRoom(roomName);
            }
          }
        } catch (error) {
          console.log('Error checking participants:', error.message);
          try {
            await this.roomService.deleteRoom(roomName);
            await new Promise((resolve) => setTimeout(resolve, 500));
            await this.createRoom(roomName, 2);
            console.log('Room recreated after cleanup');
          } catch (recreateError) {
            console.log('Failed to recreate room:', recreateError.message);
          }
        }
      }

      return {
        token: await generateToken({
          room: roomName,
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
        }),
      };
    } else {
      // Генерация токена для других типов чатов
      const grants = {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        ...(isSuccess && { roomAdmin: true }), // Добавляем roomAdmin только если isSuccess === true
      };

      return { token: await generateToken(grants) };
    }
  }

  private async cleanupRoom(roomName: string): Promise<void> {
    try {
      const participants = await this.roomService.listParticipants(roomName);

      // Удаляем всех участников
      for (const participant of participants) {
        try {
          await this.roomService.removeParticipant(
            roomName,
            participant.identity,
          );
          console.log(`Removed participant: ${participant.identity}`);
        } catch (error) {
          console.log(
            `Failed to remove participant ${participant.identity}:`,
            error.message,
          );
        }
      }

      // Ждем завершения удаления
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('Error during room cleanup:', error.message);
    }
  }

  private async createRoom(roomName: string, maxParticipants: number) {
    try {
      await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // Время ожидания перед удалением комнаты, если она пуста (в секундах)
        maxParticipants: maxParticipants, // Ограничение на двух участников для диалога
      });
      console.log(`Room ${roomName} created`);
    } catch (error) {
      throw new ForbiddenException('Не удалось создать комнату');
    }
  }

  private getRoomName(chat): string {
    switch (chat.type) {
      case ChatRole.DIALOG:
        return `dialog:${chat.name}`;
      case ChatRole.CHANNEL:
        return `channel:${chat.name}`;
      case ChatRole.GROUP:
        return `group:${chat.name}`;
      default:
        return `default:${chat.name}`;
    }
  }

  private getEnvVariable(variable: string): string {
    const value = process.env[variable];
    if (!value) {
      throw new ForbiddenException(
        `Environment variable ${variable} is not set`,
      );
    }
    return value;
  }

  // Метод для исключения пользователя из комнаты
  async kickUser(roomName: string, userId: string) {
    try {
      await this.roomService.removeParticipant(roomName, `user:${userId}`);

      console.log({ success: 'User kicked successfully' });

      return { message: 'User kicked successfully' };
    } catch (error) {
      throw new ForbiddenException('Не удалось исключить пользователя');
    }
  }

  async muteUser(roomName: string, userId: string, isMuted: boolean) {
    try {
      // Получение информации об участнике, чтобы найти trackSid
      const participantInfo = await this.roomService.getParticipant(
        roomName,
        `user:${userId}`,
      );

      if (!participantInfo) {
        throw new NotFoundException('Участник не найден в комнате');
      }

      // Предположим, что мы хотим управлять первым аудиотреком
      const audioTrack = participantInfo.tracks.find(
        (track) => track.type === TrackType.AUDIO,
      );

      if (!audioTrack) {
        throw new NotFoundException('Аудиотрек не найден');
      }

      await this.roomService.mutePublishedTrack(
        roomName,
        `user:${userId}`,
        audioTrack.sid,
        isMuted,
      );

      const action = isMuted ? 'muted' : 'unmuted';

      console.log({ success: `User ${action} successfully` });

      return { message: `User ${action} successfully` };
    } catch (error) {
      throw new ForbiddenException(
        'Не удалось изменить статус mute для пользователя',
      );
    }
  }

  private async validateRoom(roomId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: roomId,
      },
    });

    if (!chat) throw new NotFoundException('Chat not found');

    const member = await this.prisma.chatMember.findFirst({
      where: {
        userId: userId,
        chatId: chat.id,
      },
      include: {
        user: true,
        chat: true,
      },
    });

    if (!member) throw new NotFoundException('Member not found');

    const isSuccess =
      member.role === MemberRole.OWNER ||
      member.role === MemberRole.ADMIN ||
      member.role === MemberRole.MODERATOR;

    const roomName = this.getRoomName(chat);

    const apiKey = this.getEnvVariable('LIVEKIT_API_KEY');
    const apiSecret = this.getEnvVariable('LIVEKIT_API_SECRET');
    const wsUrl = this.getEnvVariable('LIVEKIT_URL');

    if (!apiKey || !apiSecret || !wsUrl)
      throw new ForbiddenException('Server misconfigured');

    return { roomName, apiKey, apiSecret, wsUrl, chat, isSuccess };
  }
}
