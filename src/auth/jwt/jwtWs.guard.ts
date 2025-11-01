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
    const authorizationHeader: string =
      client?.handshake?.headers?.authorization || '';
    const cookieHeader: string = client?.handshake?.headers?.cookie || '';

    const tokenFromHeader = extractTokenFromAuthHeader(authorizationHeader);
    const tokenFromAuth = client?.handshake?.auth?.token;
    const tokenFromCookie = getCookie('accessToken', cookieHeader);

    const token = tokenFromHeader || tokenFromAuth || tokenFromCookie;

    if (!token) {
      return false; // No token provided
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      if (decoded?.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

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

function extractTokenFromAuthHeader(header?: string) {
  if (!header) return undefined;

  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) return undefined;

  return token;
}
