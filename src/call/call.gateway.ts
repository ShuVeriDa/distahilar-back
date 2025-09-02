import { JwtService } from '@nestjs/jwt';
import {
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
import { CallService } from './call.service';
import {
  CallEndDto,
  CallResponseDto,
  InitiateCallDto,
  JoinVoiceChatDto,
  LeaveVoiceChatDto,
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
  ) {}

  handleConnection(client: Socket) {
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
  }

  handleDisconnect(client: Socket) {
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
