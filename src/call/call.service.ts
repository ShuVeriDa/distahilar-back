import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole, MemberRole } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

import { v4 as uuidv4 } from 'uuid';
import {
  CallActionEnum,
  CallEndDto,
  CallNotification,
  CallResponseDto,
  CallStatus,
  CallStatusEnum,
  InitiateCallDto,
} from './call.type';

@Injectable()
export class CallService {
  private activeCalls = new Map<string, CallStatus>(); // callId => CallStatus
  private voiceRooms = new Map<string, Set<string>>(); // chatId => Set<userId>

  constructor(private readonly prisma: PrismaService) {}

  // Инициация звонка (как в Telegram)
  async initiateCall(dto: InitiateCallDto, callerId: string) {
    const { chat, targetUserId } = await this.validateDialogCall(
      dto.chatId,
      callerId,
    );

    const callId = uuidv4();
    const caller = await this.prisma.user.findUnique({
      where: { id: callerId },
      select: { username: true, id: true },
    });

    const callStatus: CallStatus = {
      id: callId,
      chatId: dto.chatId,
      callerId,
      participantIds: [callerId, targetUserId],
      status: CallStatusEnum.INITIATED,
      isVideoCall: dto.isVideoCall || false,
      startedAt: new Date(),
    };

    this.activeCalls.set(callId, callStatus);

    const notification: CallNotification = {
      callId,
      callerId,
      callerName: caller.username,
      chatId: dto.chatId,
      chatName: chat.name,
      isVideoCall: dto.isVideoCall || false,
      timestamp: Date.now(),
    };

    // Автоматическое отклонение через 30 секунд
    setTimeout(() => {
      const call = this.activeCalls.get(callId);
      if (call && call.status === CallStatusEnum.INITIATED) {
        call.status = CallStatusEnum.ENDED;
        call.endedAt = new Date();
        this.activeCalls.delete(callId);
      }
    }, 30000);

    return { callId, targetUserId, notification };
  }

  // Ответ на звонок
  async respondToCall(dto: CallResponseDto, userId: string) {
    const call = this.activeCalls.get(dto.callId);

    if (!call) {
      throw new NotFoundException('Call not found or expired');
    }

    if (!call.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not part of this call');
    }

    if (call.status !== CallStatusEnum.INITIATED) {
      throw new BadRequestException('Call is no longer available');
    }

    if (dto.action === CallActionEnum.REJECT) {
      call.status = CallStatusEnum.ENDED;
      call.endedAt = new Date();
      this.activeCalls.delete(dto.callId);

      return {
        callId: dto.callId,
        status: 'rejected',
        callerId: call.callerId,
        participantIds: call.participantIds,
      };
    } else if (dto.action === CallActionEnum.ACCEPT) {
      call.status = CallStatusEnum.ACTIVE;

      // Для WebRTC токены/комната не нужны. Клиенты установят P2P соединение через сигналинг
      return {
        callId: dto.callId,
        status: CallStatusEnum.ACTIVE,
        callerId: call.callerId,
        participantIds: call.participantIds,
      };
    }
  }

  // Завершение звонка
  async endCall(dto: CallEndDto, userId: string) {
    const call = this.activeCalls.get(dto.callId);

    if (!call) {
      throw new NotFoundException('Call not found');
    }

    if (!call.participantIds.includes(userId)) {
      throw new ForbiddenException('You are not part of this call');
    }

    call.status = CallStatusEnum.ENDED;
    call.endedAt = new Date();
    this.activeCalls.delete(dto.callId);

    return {
      callId: dto.callId,
      status: 'ended',
      endedBy: userId,
      participantIds: call.participantIds,
    };
  }

  // Присоединение к голосовому чату группы/канала (WebRTC, без медиасервера)
  async joinVoiceChat(chatId: string, userId: string) {
    const { chat } = await this.validateRoom(chatId, userId);

    if (!this.voiceRooms.has(chat.id)) {
      this.voiceRooms.set(chat.id, new Set());
    }
    const participants = this.voiceRooms.get(chat.id);
    participants.add(userId);

    return { chatId: chat.id, participants: Array.from(participants) };
  }

  async leaveVoiceChat(chatId: string, userId: string) {
    const { chat } = await this.validateRoom(chatId, userId);
    const participants = this.voiceRooms.get(chat.id);
    if (participants) {
      participants.delete(userId);
      if (participants.size === 0) {
        this.voiceRooms.delete(chat.id);
      }
    }
    return {
      chatId: chat.id,
      participants: participants ? Array.from(participants) : [],
    };
  }

  // Валидация диалога для звонка
  private async validateDialogCall(chatId: string, callerId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.type !== ChatRole.DIALOG) {
      throw new BadRequestException(
        'Direct calls are only available for dialogs',
      );
    }

    if (chat.members.length !== 2) {
      throw new BadRequestException('Dialog must have exactly 2 members');
    }

    const callerMember = chat.members.find((m) => m.userId === callerId);
    if (!callerMember) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    const targetUserId = chat.members.find(
      (m) => m.userId !== callerId,
    )?.userId;
    if (!targetUserId) {
      throw new NotFoundException('Target user not found');
    }

    return { chat, targetUserId };
  }

  // Ниже — оставшиеся утилиты для формирования имени (если понадобится в UI)

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

  // Удалены зависимости от переменных окружения медиасервера

  private async validateRoom(roomId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: roomId },
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
    return { roomName, chat, isSuccess };
  }

  // Методы для управления участниками (как в оригинале)
  async kickUser(roomName: string, userId: string) {
    // Без медиасервера кик означает удалить из набора участников
    const participants = this.voiceRooms.get(roomName);
    if (!participants) throw new NotFoundException('Комната не найдена');
    participants.delete(userId);
    return { message: 'User kicked successfully' };
  }

  async muteUser(roomName: string, userId: string, isMuted: boolean) {
    // На P2P mute обрабатывается на клиенте. Здесь можно только валидировать членство.
    const participants = this.voiceRooms.get(roomName);
    if (!participants || !participants.has(userId)) {
      throw new NotFoundException('Участник не найден в комнате');
    }
    const action = isMuted ? 'muted' : 'unmuted';
    return { message: `User ${action} successfully` };
  }
}
