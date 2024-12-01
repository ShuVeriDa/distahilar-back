import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { Response } from 'express';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { LoginDto } from 'src/user/dto/login.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwt: JwtService,
    private userService: UserService,
  ) {}

  async login(dto: LoginDto) {
    const { password: _, ...user } = await this.validateUser(dto);

    const tokens = await this.issueTokens(user.id);

    return {
      user,
      ...tokens,
    };
  }

  async register(dto: CreateUserDto) {
    const oldUser = await this.userService.getByUserName(dto.username);

    if (oldUser)
      throw new ConflictException('User with this username already exists');

    const { password: _, ...user } = await this.userService.create(dto);

    const tokens = await this.issueTokens(user.id);

    return {
      user,
      ...tokens,
    };
  }

  private async issueTokens(userId: string) {
    const data = { id: userId };

    const accessToken = this.jwt.sign(data, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = this.jwt.sign(data, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  addRefreshTokenResponse(res: Response, refreshToken: string) {
    const expiresIn = new Date();
    expiresIn.setDate(
      expiresIn.getDate() + Number(process.env.EXPIRE_DAY_REFRESH_TOKEN),
    );

    res.cookie(process.env.REFRESH_TOKEN_NAME, refreshToken, {
      //серверные куки, не будет показывать в браузере, должны быть в безопасности
      httpOnly: true,
      domain: process.env.DOMAIN,
      // время окончания куки
      expires: expiresIn,
      //true if production
      secure: true,
      //lax if production
      sameSite: 'none',
    });
  }

  private async validateUser(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { username: dto.username },
      include: { settings: true },
    });

    if (!user) throw new NotFoundException('The user not found');

    const isValid = await verify(user.password, dto.password);

    if (!isValid) throw new UnauthorizedException('Invalid password');

    return user;
  }

  removeRefreshTokenFromResponse(res: Response) {
    res.cookie(process.env.REFRESH_TOKEN_NAME, '', {
      //серверное куки, не будет показывать в браузере, должны быть в безопасности
      httpOnly: true,
      domain: process.env.DOMAIN,
      // время окончания куки
      expires: new Date(0),
      //true if production
      secure: true,
      //lax if production
      sameSite: 'none',
    });
  }

  async getNewTokens(refreshToken: string) {
    const result = await this.jwt.verifyAsync(refreshToken);

    if (!result) throw new UnauthorizedException('Invalid refresh token');

    const { password, ...user } = await this.userService.getUserById(result.id);

    const tokens = await this.issueTokens(user.id);

    return {
      user,
      ...tokens,
    };
  }
}
