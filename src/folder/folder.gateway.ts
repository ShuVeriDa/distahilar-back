import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Folder } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthWS } from 'src/auth/decorators/auth.decorator';
import { UserWs } from 'src/user/decorators/user.decorator';
import { FolderService } from './folder.service';

@WebSocketGateway()
export class FolderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly folderService: FolderService) {}

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id} ${args}`);
  }

  @SubscribeMessage('folders')
  @AuthWS()
  async getChatByQuery(@UserWs('id') userId: string) {
    const folders = await this.folderService.fetchFolders(userId);

    this.emitFetchFolders(userId, folders);

    return folders;
  }

  private emitFetchFolders(userId: string, folders: Folder[]) {
    const fetchKey = `folders:user:${userId}:fetch`;

    this.server.emit(fetchKey, folders);
  }
}
