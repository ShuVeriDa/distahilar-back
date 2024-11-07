import { Injectable, NotFoundException } from '@nestjs/common';
import { Language, Prisma } from '@prisma/client';
import { hash } from 'argon2';
import { PrismaService } from 'src/prisma.service';
import { ChangeSettingsDto } from './dto/change-settings.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        folders: true,
      },
    });

    delete user.password;

    if (!user) throw new NotFoundException('The user not found');

    return user;
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
    const user = await this.userObj(dto);

    return this.prisma.user.create({
      data: user,
    });
  }

  async updateUser(dto: UpdateUserDto, userId: string) {
    const user = await this.getUserById(userId);

    const password = dto.password ? await hash(dto.password) : undefined;

    const createdUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: dto.email,
        password: password,
        name: dto.name,
        username: dto.username,
        phone: dto.phone,
        bio: dto.bio,
        imageUrl: dto.imageUrl,
      },
      include: {
        folders: true,
      },
    });

    delete createdUser.password;

    return createdUser;
  }

  async changeSettings(userId: string, dto: ChangeSettingsDto) {
    const user = await this.validateUser(userId);

    const userSettings = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        settings: {
          update: {
            data: {
              language: dto.language.toUpperCase() as Language,
              notifications: dto.notifications,
            },
          },
        },
      },
      include: {
        settings: {
          select: {
            id: true,
            language: true,
            notifications: true,
          },
        },
      },
    });

    const { password, ...rest } = userSettings;

    return rest;
  }

  async deleteUser(userId: string) {
    const user = await this.validateUser(userId);

    await this.prisma.user.delete({
      where: { id: user.id },
    });

    return 'The user has been deleted successfully';
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('The user not found');

    return user;
  }

  private userObj = async (dto: CreateUserDto) => {
    const imageUrl = dto.imageUrl
      ? dto.imageUrl
      : '/uploads/avatar/avatar-default.png';

    const user = {
      email: dto.email,
      password: await hash(dto.password),
      name: dto.name,
      username: dto.username,
      phone: dto.phone,
      bio: dto.bio,
      imageUrl: imageUrl,
      settings: {
        create: {
          language: Language.EN,
        },
      },
      folders: {
        create: [
          {
            name: 'All chats',
            imageUrl: 'AllChats',
          },
        ],
      },
    } as Prisma.UserCreateInput;

    return user;
  };
}
