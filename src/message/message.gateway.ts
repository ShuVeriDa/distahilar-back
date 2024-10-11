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
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageService } from './message.service';

@WebSocketGateway()
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  constructor(private readonly messageService: MessageService) {}

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: any, ...args: any[]) {
    console.log(`Client connected: ${client.id} ${args}`);
  }

  afterInit(server: Server) {
    console.log('WebSocket message gateway initialized');
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

  private emitCrateMessage(chatId: string, message: any) {
    const fetchKey = `chat:${chatId}:message:create`;
    this.server.emit(fetchKey, message);
  }
}
