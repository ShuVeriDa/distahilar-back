import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from './user.service';

@WebSocketGateway()
export class UserGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = this.getUserId(client);

    if (userId) {
      await this.userService.updateOnlineStatus(true, userId);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.getUserId(client);
    if (userId) {
      await this.userService.updateOnlineStatus(false, userId);
    }
  }

  afterInit(server: Server) {
    console.log('WebSocket message gateway initialized');
  }

  getUserId(client: Socket) {
    if (!client.handshake.headers.cookie) return;

    const token = client.handshake.headers.cookie.split('=')[1];

    if (!token) return;

    const decoded = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
    const userId = decoded.id;

    return userId;
  }
}
