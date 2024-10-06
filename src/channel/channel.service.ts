import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole, MemberRole } from '@prisma/client';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateChannelDto } from './dto/create.dto';
import { UpdateChannelDto } from './dto/update.dto';

@Injectable()
export class ChannelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
  ) {}

  async createChannel(dto: CreateChannelDto, userId: string) {
    const user = await this.userService.getById(userId);
    const folderId = user.folders[0].id;

    const channel = await this.prisma.chat.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl || '/uploads/avatar/channel-logo.png',
        type: ChatRole.CHANNEL,
        link: uuidv4(),
        folders: {
          connect: {
            id: folderId,
          },
        },
        members: {
          create: [{ userId: user.id, role: MemberRole.OWNER }],
        },
      },
      include: {
        members: true,
        messages: true,
      },
    });

    return channel;
  }

  async updateChannel(
    dto: UpdateChannelDto,
    channelId: string,
    userId: string,
  ) {
    const channel = await this.chatService.getChat(channelId);
    const user = await this.userService.getById(userId);

    if (channel.type !== ChatRole.CHANNEL) {
      throw new ForbiddenException('This action is not allowed');
    }

    const member = channel.members.find((member) => member.userId === user.id);

    if (!member) throw new NotFoundException("You don't have rights");

    const isGuest = member.role === MemberRole.GUEST;

    if (isGuest) throw new ForbiddenException("You don't have rights");

    return this.prisma.chat.update({
      where: {
        id: channel.id,
      },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
      },
      include: {
        members: true,
        messages: true,
      },
    });
  }
}
