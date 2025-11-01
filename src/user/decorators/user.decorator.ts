import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User as UserPrisma } from '@prisma/client';
import * as process from 'node:process';

export const User = createParamDecorator(
  (data: keyof UserPrisma, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user[data] : user;
  },
);

export const UserWs = createParamDecorator(
  (data: keyof UserPrisma, context: ExecutionContext) => {
    const client = context.switchToWs().getClient();
    const authorizationHeader: string =
      client?.handshake?.headers?.authorization || '';
    const cookieHeader: string = client?.handshake?.headers?.cookie || '';

    const tokenFromHeader = extractTokenFromAuthHeader(authorizationHeader);
    const tokenFromAuth = client?.handshake?.auth?.token;
    const tokenFromCookie = getCookie('accessToken', cookieHeader);

    const token = tokenFromHeader || tokenFromAuth || tokenFromCookie;

    if (!token) return null;

    const jwtService = new JwtService();

    const decoded = jwtService.verify(token, {
      secret: process.env.JWT_ACCESS_SECRET,
    });

    if (decoded?.type !== 'access') return null;

    return data ? decoded[data] : decoded;
  },
);

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
