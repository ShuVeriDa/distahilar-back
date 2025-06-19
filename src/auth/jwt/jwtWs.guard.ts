import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as process from 'node:process';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToWs().getClient().handshake;
    const token = request.headers.cookie.split('=')[1];

    if (!token) {
      return false; // No token provided
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      return !!decoded;
    } catch (err) {
      throw new UnauthorizedException(err); // Token verification failed
    }
  }
}
