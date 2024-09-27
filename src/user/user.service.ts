import { Injectable } from '@nestjs/common';
import { Language, Prisma } from '@prisma/client';
import { hash } from 'argon2';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email },
    });
  }

  async getByUserName(username: string) {
    return this.prisma.user.findFirst({
      where: { username: username },
    });
  }

  async create(dto: CreateUserDto) {
    const user = {
      email: dto.email,
      password: await hash(dto.password),
      name: dto.name,
      username: dto.username,
      phone: dto.phone,
      bio: dto.bio,
      imageUrl: dto.imageUrl
        ? dto.imageUrl
        : '/uploads/avatar/avatar-default.png',
      settings: {
        create: {
          language: Language.EN,
        },
      },
    } as Prisma.UserCreateInput;

    return this.prisma.user.create({
      data: user,
    });
  }
}
