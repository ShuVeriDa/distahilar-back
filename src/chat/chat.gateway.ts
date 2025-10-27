import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthWS } from 'src/auth/decorators/auth.decorator';
import { UserWs } from 'src/user/decorators/user.decorator';
import { ChatService } from './chat.service';
import { FetchChatsDto } from './dto/fetch.dto';
import { ChatSearchDto } from './dto/search.dto';
import { FoundedChatsType } from './types.type';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly chatService: ChatService) {}

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
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
}
