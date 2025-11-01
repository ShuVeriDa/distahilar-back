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
import { UserStatusService } from 'src/user/user-status.service';
import { ChatService } from './chat.service';
import { FetchChatsDto } from './dto/fetch.dto';
import { ChatSearchDto } from './dto/search.dto';
import { FoundedChatsType } from './types.type';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(
    private readonly chatService: ChatService,
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

  broadcastMessage() {
    const message = 'Hello, world!';
    this.server.emit('message', message); // Рассылаем всем подключенным клиентам
  }

  @SubscribeMessage('fetchChats')
  @AuthWS()
  async fetchChats(
    @MessageBody() dto: FetchChatsDto,
    @UserWs('id') userId: string,
  ) {
    const chats = await this.chatService.fetchChats(dto, userId);

    this.emitFetchChats(dto.folder, chats);

    return chats;
  }

  @SubscribeMessage('searchChats')
  @AuthWS()
  async searchChatsByQuery(
    @MessageBody() dto: ChatSearchDto,
    @UserWs('id') userId: string,
  ) {
    const chats = await this.chatService.searchChatsByQuery(dto, userId);

    this.emitSearchChats(dto.name, chats);

    return chats;
  }

  private emitSearchChats(query: string, chats: FoundedChatsType[]) {
    const fetchKey = `chats:query:${query}:search`;

    this.server.emit(fetchKey, chats);
  }

  private emitFetchChats(folder: string, chats: FoundedChatsType[]) {
    const fetchKey = `chats:${folder}`;

    this.server.emit(fetchKey, chats);
  }

  private extractUserId(client: Socket): string | null {
    try {
      const token =
        client.handshake.auth?.token ||
        cookie.parse(client.handshake.headers.cookie || '')?.accessToken;

      if (!token) return null;

      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      if (decoded?.type !== 'access') return null;

      return decoded.id;
    } catch (err) {
      return null;
    }
  }
}
