import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';
import { UserStatusService } from './user-status.service';

@WebSocketGateway()
export class UserGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly userStatusService: UserStatusService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = this.extractUserId(client);
    if (!userId) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    await this.userStatusService.handleConnection(userId);
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.userStatusService.handleDisconnect(userId);
    console.log(`Client disconnected: ${client.id}`, { userId });
  }

  afterInit(server: Server) {
    this.userStatusService.setServer(server);
    console.log('WebSocket user gateway initialized');
  }

  extractUserId(client: Socket): string | null {
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
