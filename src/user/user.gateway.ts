import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthWS } from 'src/auth/decorators/auth.decorator';
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

  @AuthWS()
  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization;

    const decoded = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    const userId = decoded.id;

    if (userId) {
      await this.userService.updateOnlineStatus(true, userId);
    }
  }

  async handleDisconnect(client: Socket) {
    const token = client.handshake.headers.authorization;

    const decoded = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    const userId = decoded.id;

    if (userId) {
      await this.userService.updateOnlineStatus(false, userId);
    }
  }

  afterInit(server: Server) {
    console.log('WebSocket message gateway initialized');
  }
}
