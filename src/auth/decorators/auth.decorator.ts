import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../jwt/jwt.guard';
import { AuthGuard } from '../jwt/jwtWs.guard';

export const Auth = () => UseGuards(JwtAuthGuard);
export const AuthWS = () => UseGuards(AuthGuard);
