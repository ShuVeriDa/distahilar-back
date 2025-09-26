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
  LiveRoomState,
} from './call.type';

@Injectable()
export class CallService {
  private activeCalls = new Map<string, CallStatus>(); // callId => CallStatus
  private voiceRooms = new Map<string, Set<string>>(); // chatId => Set<userId>
  private liveRooms = new Map<string, LiveRoomState>(); // chatId => LiveRoomState

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

  // ========================
  // Live streams (groups & channels)
  // ========================

  async startLive(chatId: string, userId: string): Promise<LiveRoomState> {
    const { chat, isSuccess } = await this.validateRoom(chatId, userId);
    if (!(chat.type === ChatRole.GROUP || chat.type === ChatRole.CHANNEL)) {
      throw new BadRequestException(
        'Live stream is available only for groups and channels',
      );
    }
    if (!isSuccess) {
      throw new ForbiddenException(
        'Only admins or moderators can start live stream',
      );
    }
    const existing = this.liveRooms.get(chat.id);
    if (existing && existing.isLive) {
      return existing; // idempotent
    }
    const state: LiveRoomState = {
      chatId: chat.id,
      isLive: true,
      hostId: userId,
      speakers: [userId],
      listeners: [],
      raisedHands: [],
      muted: [],
      startedAt: Date.now(),
    };
    this.liveRooms.set(chat.id, state);
    return state;
  }

  async stopLive(chatId: string, userId: string): Promise<LiveRoomState> {
    const { chat, isSuccess } = await this.validateRoom(chatId, userId);
    const state = this.liveRooms.get(chat.id);
    if (!state || !state.isLive) {
      throw new NotFoundException('Live stream is not active');
    }
    if (!(isSuccess || state.hostId === userId)) {
      throw new ForbiddenException('Only host or admins can stop live stream');
    }
    state.isLive = false;
    this.liveRooms.set(chat.id, state);
    return state;
  }

  async joinLive(chatId: string, userId: string): Promise<LiveRoomState> {
    const { chat } = await this.validateRoom(chatId, userId);
    const state = this.liveRooms.get(chat.id);
    if (!state || !state.isLive) {
      throw new NotFoundException('Live stream is not active');
    }
    if (state.hostId === userId) {
      return state;
    }
    if (!state.speakers.includes(userId) && !state.listeners.includes(userId)) {
      state.listeners.push(userId);
    }
    // If user previously raised hand and rejoins, keep raisedHands as-is
    this.liveRooms.set(chat.id, state);
    return state;
  }

  async leaveLive(chatId: string, userId: string): Promise<LiveRoomState> {
    const { chat } = await this.validateRoom(chatId, userId);
    const state = this.liveRooms.get(chat.id);
    if (!state || !state.isLive) {
      throw new NotFoundException('Live stream is not active');
    }
    // Remove user from all sets
    state.listeners = state.listeners.filter((id) => id !== userId);
    state.speakers = state.speakers.filter((id) => id !== userId);
    state.raisedHands = state.raisedHands.filter((id) => id !== userId);
    state.muted = state.muted.filter((id) => id !== userId);

    if (state.hostId === userId) {
      // Host leaves: do NOT end live. Transfer host if possible; end only if no one remains
      const nextSpeaker = state.speakers[0];
      if (nextSpeaker) {
        state.hostId = nextSpeaker;
      } else if (state.listeners.length > 0) {
        const promoted = state.listeners.shift();
        if (promoted) {
          state.hostId = promoted;
          if (!state.speakers.includes(promoted)) state.speakers.push(promoted);
          // ensure promoted user is not muted by default
          state.muted = state.muted.filter((id) => id !== promoted);
        }
      } else {
        // No one left to hold the live — end it
        state.isLive = false;
        state.hostId = null;
      }
    }
    this.liveRooms.set(chat.id, state);
    return state;
  }

  async raiseHand(chatId: string, userId: string): Promise<LiveRoomState> {
    const { chat } = await this.validateRoom(chatId, userId);
    const state = this.liveRooms.get(chat.id);
    if (!state || !state.isLive) {
      throw new NotFoundException('Live stream is not active');
    }
    if (state.speakers.includes(userId) || state.hostId === userId) {
      throw new BadRequestException('Speakers cannot raise hand');
    }
    if (!state.listeners.includes(userId)) {
      state.listeners.push(userId);
    }
    if (!state.raisedHands.includes(userId)) {
      state.raisedHands.push(userId);
    }
    this.liveRooms.set(chat.id, state);
    return state;
  }

  async approveSpeaker(
    chatId: string,
    moderatorId: string,
    targetUserId: string,
  ): Promise<LiveRoomState> {
    const { chat, isSuccess } = await this.validateRoom(chatId, moderatorId);
    const state = this.liveRooms.get(chat.id);
    if (!state || !state.isLive) {
      throw new NotFoundException('Live stream is not active');
    }
    if (!(isSuccess || state.hostId === moderatorId)) {
      throw new ForbiddenException('Only host or admins can approve speakers');
    }
    if (state.hostId === targetUserId) {
      return state;
    }
    // Ensure target is a member of chat
    const isMember = await this.prisma.chatMember.findFirst({
      where: { chatId: chat.id, userId: targetUserId },
    });
    if (!isMember) throw new NotFoundException('Target user is not a member');

    state.listeners = state.listeners.filter((id) => id !== targetUserId);
    state.raisedHands = state.raisedHands.filter((id) => id !== targetUserId);
    if (!state.speakers.includes(targetUserId)) {
      state.speakers.push(targetUserId);
    }
    // On approve, unmute the user
    state.muted = state.muted.filter((id) => id !== targetUserId);
    this.liveRooms.set(chat.id, state);
    return state;
  }

  async revokeSpeaker(
    chatId: string,
    moderatorId: string,
    targetUserId: string,
  ): Promise<LiveRoomState> {
    const { chat, isSuccess } = await this.validateRoom(chatId, moderatorId);
    const state = this.liveRooms.get(chat.id);
    if (!state || !state.isLive) {
      throw new NotFoundException('Live stream is not active');
    }
    if (!(isSuccess || state.hostId === moderatorId)) {
      throw new ForbiddenException('Only host or admins can revoke speakers');
    }
    if (state.hostId === targetUserId) {
      throw new BadRequestException('Cannot revoke host speaker role');
    }
    state.speakers = state.speakers.filter((id) => id !== targetUserId);
    if (!state.listeners.includes(targetUserId)) {
      state.listeners.push(targetUserId);
    }
    state.muted = state.muted.filter((id) => id !== targetUserId);
    this.liveRooms.set(chat.id, state);
    return state;
  }

  async toggleMute(
    chatId: string,
    moderatorId: string,
    targetUserId: string,
    isMuted: boolean,
  ): Promise<LiveRoomState> {
    const { chat, isSuccess } = await this.validateRoom(chatId, moderatorId);
    const state = this.liveRooms.get(chat.id);
    if (!state || !state.isLive) {
      throw new NotFoundException('Live stream is not active');
    }
    if (!(isSuccess || state.hostId === moderatorId)) {
      throw new ForbiddenException('Only host or admins can mute/unmute');
    }
    if (
      !state.speakers.includes(targetUserId) &&
      state.hostId !== targetUserId
    ) {
      throw new BadRequestException('Only speakers can be muted');
    }
    if (isMuted) {
      if (!state.muted.includes(targetUserId)) state.muted.push(targetUserId);
    } else {
      state.muted = state.muted.filter((id) => id !== targetUserId);
    }
    this.liveRooms.set(chat.id, state);
    return state;
  }

  async getLiveRoomState(
    chatId: string,
    userId: string,
  ): Promise<LiveRoomState> {
    const { chat } = await this.validateRoom(chatId, userId);
    const state = this.liveRooms.get(chat.id);
    if (!state) {
      throw new NotFoundException('Live room not found');
    }
    return state;
  }

  // ================
  // Live signaling helpers
  // ================

  async validateLiveParticipants(
    chatId: string,
    fromUserId: string,
    toUserId: string,
  ) {
    const { chat } = await this.validateRoom(chatId, fromUserId);
    const state = this.liveRooms.get(chat.id);
    if (!state || !state.isLive) {
      throw new NotFoundException('Live stream is not active');
    }
    const isInAudience = (userId: string) =>
      state.hostId === userId ||
      state.speakers.includes(userId) ||
      state.listeners.includes(userId);

    if (!isInAudience(fromUserId)) {
      throw new ForbiddenException('Sender is not in the live room');
    }
    if (!isInAudience(toUserId)) {
      throw new NotFoundException('Recipient is not in the live room');
    }
    return { chat, state };
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
