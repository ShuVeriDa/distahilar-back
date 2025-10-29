import { JwtService } from '@nestjs/jwt';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Message, Prisma } from '@prisma/client';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';
import { AuthWS } from 'src/auth/decorators/auth.decorator';
import { UserWs } from 'src/user/decorators/user.decorator';
import { UserStatusService } from 'src/user/user-status.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { FetchMessageDto } from './dto/fetch-message.dto';
import { PinMessageDto } from './dto/pin-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';
import { ReactionService } from './reaction.service';

@WebSocketGateway()
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  constructor(
    private readonly messageService: MessageService,
    private reactionService: ReactionService,
    private readonly userStatusService: UserStatusService,
    private readonly jwtService: JwtService,
  ) {}

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      await this.userStatusService.handleDisconnect(userId);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    const userId = this.extractUserId(client);
    if (userId) {
      client.data.userId = userId;
      await this.userStatusService.handleConnection(userId);
    }
    console.log(`Client connected: ${client.id} ${args}`);
  }

  afterInit(server: Server) {
    console.log('WebSocket message gateway initialized');
  }

  @AuthWS()
  @SubscribeMessage('joinChat')
  async handleJoinChat(client: Socket, obj: { chatId: string }) {
    client.join(obj.chatId);
    console.log(`Client ${client.id} joined chat: ${obj.chatId}`);
  }

  @SubscribeMessage('getMessages')
  @AuthWS()
  async getMessages(
    @MessageBody() dto: FetchMessageDto,
    @UserWs('id') userId: string,
  ) {
    const { messages, chatId, nextCursor, updates } =
      await this.messageService.getMessages(dto, userId);

    if (updates && (updates as any).count > 0) {
      this.emitUpdateMessages(chatId, updates);
    }

    this.emitFetchMessages(chatId, messages, nextCursor);

    return { messages, nextCursor };
  }

  @SubscribeMessage('createMessage')
  @AuthWS()
  async createMessage(
    @MessageBody() dto: CreateMessageDto,
    @UserWs('id') userId: string,
  ) {
    // chatname, chatType, chatId
    const createdMessage = await this.messageService.createMessage(dto, userId);

    this.emitCrateMessage(createdMessage.chatId, createdMessage);

    return createdMessage;
  }

  @SubscribeMessage('editMessage')
  @AuthWS()
  async editMessage(
    @MessageBody() dto: UpdateMessageDto,
    @UserWs('id') userId: string,
  ) {
    const updatedMessage = await this.messageService.editMessage(dto, userId);

    this.emitUpdateMessage(updatedMessage.chatId, updatedMessage);

    return updatedMessage;
  }

  @SubscribeMessage('deleteMessage')
  @AuthWS()
  async deleteMessage(
    @MessageBody() dto: DeleteMessageDto,
    @UserWs('id') userId: string,
  ) {
    const deletedMessages = await this.messageService.deleteMessage(
      dto,
      userId,
    );

    this.emitUpdateMessages(deletedMessages[0].chatId, deletedMessages);

    return 'Message has been deleted';
  }

  // Reactions
  @SubscribeMessage('createReaction')
  @AuthWS()
  async createReaction(
    @MessageBody() dto: CreateReactionDto,
    @UserWs('id') userId: string,
  ) {
    const message = await this.reactionService.createReaction(dto, userId);

    this.emitUpdateMessage(message.chatId, message);

    return message;
  }

  //Pin a message
  @SubscribeMessage('pinMessage')
  @AuthWS()
  async pinMessage(
    @MessageBody() dto: PinMessageDto,
    @UserWs('id') userId: string,
  ) {
    const message = await this.messageService.pinMessage(dto, userId);

    this.emitUpdateMessage(message.chatId, message);

    return message;
  }

  private emitFetchMessages(
    chatId: string,
    message: Message[],
    nextCursor?: string,
  ) {
    const fetchKey = `chat:${chatId}:messages:fetch`;
    this.server.to(chatId).emit(fetchKey, message, nextCursor);
  }

  private emitCrateMessage(chatId: string, message: Message) {
    const fetchKey = `chat:${chatId}:message:create`;
    this.server.to(chatId).emit(fetchKey, message);
  }

  private emitUpdateMessage(chatId: string, message: Message) {
    const fetchKey = `chat:${chatId}:message:update`;
    this.server.to(chatId).emit(fetchKey, message);
  }

  private emitUpdateMessages(
    chatId: string,
    messages: Message[] | Prisma.BatchPayload,
  ) {
    const fetchKey = `chat:${chatId}:messages:update`;
    this.server.to(chatId).emit(fetchKey, messages);
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
