import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Message } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthWS } from 'src/auth/decorators/auth.decorator';
import { UserWs } from 'src/user/decorators/user.decorator';
import { CreateMessageDto } from './dto/create-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { FetchMessageDto } from './dto/fetch-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@WebSocketGateway()
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  constructor(private readonly messageService: MessageService) {}

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id} ${args}`);
  }

  afterInit(server: Server) {
    console.log('WebSocket message gateway initialized');
  }

  @SubscribeMessage('getMessages')
  @AuthWS()
  async getMessages(
    @MessageBody() dto: FetchMessageDto,
    @UserWs('id') userId: string,
  ) {
    const { messages, chatId, nextCursor } =
      await this.messageService.getMessages(dto, userId);

    this.emitFetchMessages(chatId, messages, nextCursor);

    return messages;
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
    const deletedMessage = await this.messageService.deleteMessage(dto, userId);

    this.emitUpdateMessage(deletedMessage.chatId, deletedMessage);

    return 'Message has been deleted';
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
}
