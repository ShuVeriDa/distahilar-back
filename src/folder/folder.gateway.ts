import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Folder } from '@prisma/client';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';
import { AuthWS } from 'src/auth/decorators/auth.decorator';
import { UserWs } from 'src/user/decorators/user.decorator';
import { UserStatusService } from 'src/user/user-status.service';
import { FolderService } from './folder.service';

@WebSocketGateway()
export class FolderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(
    private readonly folderService: FolderService,
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
