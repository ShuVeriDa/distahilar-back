import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';
import { AuthWS } from 'src/auth/decorators/auth.decorator';
import { UserWs } from 'src/user/decorators/user.decorator';
import { UserStatusService } from 'src/user/user-status.service';
import { CallService } from './call.service';
import {
  ApproveSpeakerDto,
  CallEndDto,
  CallResponseDto,
  GetLiveRoomStateDto,
  InitiateCallDto,
  JoinLiveDto,
  JoinVoiceChatDto,
  LeaveLiveDto,
  LeaveVoiceChatDto,
  LiveWebRtcAnswerDto,
  LiveWebRtcIceCandidateDto,
  LiveWebRtcOfferDto,
  RaiseHandDto,
  RevokeSpeakerDto,
  StartLiveDto,
  StopLiveDto,
  ToggleMuteDto,
  WebRtcAnswerDto,
  WebRtcIceCandidateDto,
  WebRtcOfferDto,
} from './call.type';

@WebSocketGateway()
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, Socket[]>(); // userId => sockets

  constructor(
    private readonly callService: CallService,
    private readonly jwtService: JwtService,
    private readonly userStatusService: UserStatusService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    console.log({ userId, connectedUsers: this.connectedUsers });
    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;

    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    this.connectedUsers.get(userId).push(client);

    await this.userStatusService.handleConnection(userId);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    console.log('userId', userId);
    if (!userId) return;

    const userSockets = this.connectedUsers.get(userId) || [];
    const index = userSockets.indexOf(client);
    if (index > -1) {
      userSockets.splice(index, 1);
    }

    if (userSockets.length === 0) {
      this.connectedUsers.delete(userId);
    }

    await this.userStatusService.handleDisconnect(userId);
  }

  @SubscribeMessage('initiateCall')
  @AuthWS()
  async initiateCall(
    @MessageBody() dto: InitiateCallDto,
    @UserWs('id') userId: string,
  ) {
    const result = await this.callService.initiateCall(dto, userId);

    // Отправляем уведомление получателю
    this.sendCallNotification(result.targetUserId, result.notification);

    return result;
  }

  @SubscribeMessage('respondToCall')
  @AuthWS()
  async respondToCall(
    @MessageBody() dto: CallResponseDto,
    @UserWs('id') userId: string,
  ) {
    const result = await this.callService.respondToCall(dto, userId);

    // Уведомляем инициатора звонка о ответе
    this.sendCallResponse(result.callerId, result);

    return result;
  }

  @SubscribeMessage('endCall')
  @AuthWS()
  async endCall(@MessageBody() dto: CallEndDto, @UserWs('id') userId: string) {
    const result = await this.callService.endCall(dto, userId);

    // Уведомляем всех участников о завершении звонка
    result.participantIds.forEach((participantId) => {
      if (participantId !== userId) {
        this.sendCallEnd(participantId, result);
      }
    });

    return result;
  }

  @SubscribeMessage('joinVoiceChat')
  @AuthWS()
  async joinVoiceChat(
    @MessageBody() dto: JoinVoiceChatDto,
    @UserWs('id') userId: string,
  ) {
    const result = await this.callService.joinVoiceChat(dto.chatId, userId);
    // Уведомить остальных участников о присоединении
    result.participants
      .filter((pId: string) => pId !== userId)
      .forEach((pId: string) => {
        this.emitToUser(pId, 'voiceChatParticipantJoined', {
          chatId: result.chatId,
          userId,
        });
      });
    return result;
  }

  @SubscribeMessage('leaveVoiceChat')
  @AuthWS()
  async leaveVoiceChat(
    @MessageBody() dto: LeaveVoiceChatDto,
    @UserWs('id') userId: string,
  ) {
    const result = await this.callService.leaveVoiceChat(dto.chatId, userId);
    result.participants.forEach((pId: string) => {
      this.emitToUser(pId, 'voiceChatParticipantLeft', {
        chatId: result.chatId,
        userId,
      });
    });
    return result;
  }

  // ========================
  // Live streams (groups & channels)
  // ========================

  @SubscribeMessage('startLive')
  @AuthWS()
  async startLive(
    @MessageBody() dto: StartLiveDto,
    @UserWs('id') userId: string,
  ) {
    const state = await this.callService.startLive(dto.chatId, userId);
    this.broadcastLiveState(state);
    return state;
  }

  @SubscribeMessage('stopLive')
  @AuthWS()
  async stopLive(
    @MessageBody() dto: StopLiveDto,
    @UserWs('id') userId: string,
  ) {
    const state = await this.callService.stopLive(dto.chatId, userId);
    this.broadcastLiveState(state);
    return state;
  }

  @SubscribeMessage('joinLive')
  @AuthWS()
  async joinLive(
    @MessageBody() dto: JoinLiveDto,
    @UserWs('id') userId: string,
  ) {
    const state = await this.callService.joinLive(dto.chatId, userId);
    this.broadcastLiveState(state);
    return state;
  }

  @SubscribeMessage('leaveLive')
  @AuthWS()
  async leaveLive(
    @MessageBody() dto: LeaveLiveDto,
    @UserWs('id') userId: string,
  ) {
    const state = await this.callService.leaveLive(dto.chatId, userId);
    this.broadcastLiveState(state);
    return state;
  }

  @SubscribeMessage('raiseHand')
  @AuthWS()
  async raiseHand(
    @MessageBody() dto: RaiseHandDto,
    @UserWs('id') userId: string,
  ) {
    const state = await this.callService.raiseHand(dto.chatId, userId);
    this.broadcastLiveState(state);
    return state;
  }

  @SubscribeMessage('approveSpeaker')
  @AuthWS()
  async approveSpeaker(
    @MessageBody() dto: ApproveSpeakerDto,
    @UserWs('id') moderatorId: string,
  ) {
    const state = await this.callService.approveSpeaker(
      dto.chatId,
      moderatorId,
      dto.userId,
    );
    this.broadcastLiveState(state);
    return state;
  }

  @SubscribeMessage('revokeSpeaker')
  @AuthWS()
  async revokeSpeaker(
    @MessageBody() dto: RevokeSpeakerDto,
    @UserWs('id') moderatorId: string,
  ) {
    const state = await this.callService.revokeSpeaker(
      dto.chatId,
      moderatorId,
      dto.userId,
    );
    this.broadcastLiveState(state);
    return state;
  }

  @SubscribeMessage('toggleMute')
  @AuthWS()
  async toggleMute(
    @MessageBody() dto: ToggleMuteDto,
    @UserWs('id') moderatorId: string,
  ) {
    const state = await this.callService.toggleMute(
      dto.chatId,
      moderatorId,
      dto.userId,
      dto.isMuted,
    );
    this.broadcastLiveState(state);
    return state;
  }

  @SubscribeMessage('getLiveRoomState')
  @AuthWS()
  async getLiveRoomState(
    @MessageBody() dto: GetLiveRoomStateDto,
    @UserWs('id') userId: string,
  ) {
    const state = await this.callService.getLiveRoomState(dto.chatId, userId);
    return state;
  }

  // Join/leave Socket.IO chat room (for watchers to receive broadcasts)
  @SubscribeMessage('joinChat')
  @AuthWS()
  async joinChat(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.chatId) return { ok: false };
    try {
      await client.join(payload.chatId);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  @SubscribeMessage('leaveChat')
  @AuthWS()
  async leaveChat(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!payload?.chatId) return { ok: false };
    try {
      await client.leave(payload.chatId);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  // Live WebRTC signaling within live room
  @SubscribeMessage('liveWebrtcOffer')
  @AuthWS()
  async liveWebrtcOffer(
    @MessageBody() dto: LiveWebRtcOfferDto,
    @UserWs('id') fromUserId: string,
  ) {
    await this.callService.validateLiveParticipants(
      dto.chatId,
      fromUserId,
      dto.toUserId,
    );
    this.emitToUser(dto.toUserId, 'liveWebrtcOffer', {
      chatId: dto.chatId,
      fromUserId,
      sdp: dto.sdp,
      type: dto.type,
    });
    return { ok: true };
  }

  @SubscribeMessage('liveWebrtcAnswer')
  @AuthWS()
  async liveWebrtcAnswer(
    @MessageBody() dto: LiveWebRtcAnswerDto,
    @UserWs('id') fromUserId: string,
  ) {
    await this.callService.validateLiveParticipants(
      dto.chatId,
      fromUserId,
      dto.toUserId,
    );
    this.emitToUser(dto.toUserId, 'liveWebrtcAnswer', {
      chatId: dto.chatId,
      fromUserId,
      sdp: dto.sdp,
      type: dto.type,
    });
    return { ok: true };
  }

  @SubscribeMessage('liveWebrtcIceCandidate')
  @AuthWS()
  async liveWebrtcIceCandidate(
    @MessageBody() dto: LiveWebRtcIceCandidateDto,
    @UserWs('id') fromUserId: string,
  ) {
    await this.callService.validateLiveParticipants(
      dto.chatId,
      fromUserId,
      dto.toUserId,
    );
    this.emitToUser(dto.toUserId, 'liveWebrtcIceCandidate', {
      chatId: dto.chatId,
      fromUserId,
      candidate: dto.candidate,
    });
    return { ok: true };
  }

  // WebRTC signaling: пересылка offer/answer/ice между пользователями
  @SubscribeMessage('webrtcOffer')
  @AuthWS()
  async webrtcOffer(
    @MessageBody() dto: WebRtcOfferDto,
    @UserWs('id') fromUserId: string,
  ) {
    this.emitToUser(dto.toUserId, 'webrtcOffer', {
      callId: dto.callId,
      fromUserId,
      sdp: dto.sdp,
      type: dto.type,
    });
    return { ok: true };
  }

  @SubscribeMessage('webrtcAnswer')
  @AuthWS()
  async webrtcAnswer(
    @MessageBody() dto: WebRtcAnswerDto,
    @UserWs('id') fromUserId: string,
  ) {
    this.emitToUser(dto.toUserId, 'webrtcAnswer', {
      callId: dto.callId,
      fromUserId,
      sdp: dto.sdp,
      type: dto.type,
    });
    return { ok: true };
  }

  @SubscribeMessage('webrtcIceCandidate')
  @AuthWS()
  async webrtcIceCandidate(
    @MessageBody() dto: WebRtcIceCandidateDto,
    @UserWs('id') fromUserId: string,
  ) {
    this.emitToUser(dto.toUserId, 'webrtcIceCandidate', {
      callId: dto.callId,
      fromUserId,
      candidate: dto.candidate,
    });
    return { ok: true };
  }

  private sendCallNotification(userId: string, notification: any) {
    const userSockets = this.connectedUsers.get(userId) || [];
    userSockets.forEach((socket) => {
      socket.emit('incomingCall', notification);
    });
  }

  private sendCallResponse(userId: string, response: any) {
    const userSockets = this.connectedUsers.get(userId) || [];
    userSockets.forEach((socket) => {
      socket.emit('callResponse', response);
    });
  }

  private sendCallEnd(userId: string, callEnd: any) {
    const userSockets = this.connectedUsers.get(userId) || [];
    userSockets.forEach((socket) => {
      socket.emit('callEnded', callEnd);
    });
  }

  private emitToUser(userId: string, event: string, payload: any) {
    const userSockets = this.connectedUsers.get(userId) || [];
    userSockets.forEach((socket) => socket.emit(event, payload));
  }

  private broadcastLiveState(state: any) {
    const audience = new Set<string>();
    if (state.hostId) audience.add(state.hostId);
    (state.speakers || []).forEach((id: string) => audience.add(id));
    (state.listeners || []).forEach((id: string) => audience.add(id));
    audience.forEach((userId) => this.emitToUser(userId, 'liveState', state));
    // Also broadcast to the Socket.IO room for this chat so watchers (non-participants) receive updates
    if (this.server && state.chatId) {
      this.server.to(state.chatId).emit('liveState', state);
    }
  }

  private extractUserId(client: Socket): string | null {
    try {
      const token =
        client.handshake.auth?.token ||
        cookie.parse(client.handshake.headers.cookie || '')?.accessToken;

      if (!token) return null;

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      return decoded.id;
    } catch (err) {
      return null;
    }
  }
}
