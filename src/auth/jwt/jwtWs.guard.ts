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
    const client = context.switchToWs().getClient();
    const cookieHeader: string = client?.handshake?.headers?.cookie || '';
    const token = getCookie('refreshToken', cookieHeader);

    if (!token) {
      return false; // No token provided
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      return !!decoded;
    } catch (err) {
      console.log({ err });

      throw new UnauthorizedException(err); // Token verification failed
    }
  }
}

function getCookie(name: string, cookieHeader?: string) {
  const target = (cookieHeader || '')
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(name + '='));
  return target ? decodeURIComponent(target.slice(name.length + 1)) : undefined;
}
