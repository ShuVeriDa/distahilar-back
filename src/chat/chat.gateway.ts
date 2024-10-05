import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthWS } from 'src/auth/decorators/auth.decorator';
import { UserWs } from 'src/user/decorators/user.decorator';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create.dto';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  constructor(private readonly chatService: ChatService) {}

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id} ${args}`);
  }

  afterInit(server: Server) {
    console.log('WebSocket directMessage gateway initialized');
  }

  @SubscribeMessage('createChat')
  @AuthWS()
  async createChat(
    @MessageBody() dto: CreateChatDto,
    @UserWs('id') userId: string,
  ) {
    // chatname, chatType, chatId
    const createChat = await this.chatService.createChat(dto, userId);

    this.emitCrateChat(createChat.id, createChat);

    return createChat;
  }

  private emitCrateChat(createdChatId: string, message: any) {
    const fetchKey = `createdChat:${createdChatId}:create`;
    this.server.emit(fetchKey, message);
  }
}
