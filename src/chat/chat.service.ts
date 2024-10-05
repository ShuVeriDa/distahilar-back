import { ForbiddenException, Injectable } from '@nestjs/common';
import { ChatRole } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateChatDto } from './dto/create.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async createChat(dto: CreateChatDto, userId: string) {
    if (dto.type === ChatRole.DIALOG) {
      return await this.createPrivateChat(dto, userId);
    }

    if (dto.type === ChatRole.GROUP) {
      return await this.prisma.chat.create({
        data: {
          name: dto.name,
          type: dto.type,
          link: uuidv4(),
          members: {
            create: [{ userId: userId }],
          },
        },
        include: {
          members: true,
          messages: true,
        },
      });
    }
  }

  private async createPrivateChat(dto: CreateChatDto, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        members: {
          some: {
            user: {
              username: dto.username,
            },
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (chat) throw new ForbiddenException('Chat already exists');
    const user = await this.userService.getById(userId);

    const member = await this.userService.getByUserName(dto.username);
    if (!member) throw new ForbiddenException('User not found');

    const chatName = `${user.username}-${member.username}`;

    return this.prisma.chat.create({
      data: {
        name: chatName,
        type: dto.type,
        link: uuidv4(),
        folder: {
          connect: {
            userId: userId,
          },
        },
        members: {
          create: [{ userId: userId }, { userId: member.id }],
        },
      },
      include: {
        members: true,
        messages: true,
      },
    });
  }
}
