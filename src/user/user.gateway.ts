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
import { UserService } from './user.service';

@WebSocketGateway()
export class UserGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, number>(); // userId => count of connections

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    // const userId = this.getUserId(client);

    const userId = this.extractUserId(client);
    if (!userId) {
      client.disconnect();
      return;
    }

    const count = this.connectedUsers.get(userId) || 0;
    this.connectedUsers.set(userId, count + 1);

    if (count === 0) {
      await this.userService.updateOnlineStatus(true, userId);
    }

    client.data.userId = userId;
  }

  async handleDisconnect(client: Socket) {
    // const userId = this.extractUserId(client);
    const userId = client.data.userId;
    if (!userId) return;

    const count = this.connectedUsers.get(userId) || 0;
    if (count <= 1) {
      this.connectedUsers.delete(userId);
      await this.userService.updateOnlineStatus(false, userId);
    } else {
      this.connectedUsers.set(userId, count - 1);
    }

    console.log(`Client disconnected: ${client.id}`, { userId });
  }

  afterInit(server: Server) {
    console.log('WebSocket message gateway initialized');
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

  // getUserId(client: Socket) {
  //   if (!client.handshake.headers.cookie) return;

  //   const token = client.handshake.headers.cookie.split('=')[1];

  //   if (!token) return;

  //   const decoded = this.jwtService.verify(token, {
  //     secret: process.env.JWT_SECRET,
  //   });
  //   const userId = decoded.id;

  //   return userId;
  // }
}
