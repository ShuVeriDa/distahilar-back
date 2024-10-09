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
import { CreateCommunityDto } from './dto/create.dto';
import { UpdateCommunityDto } from './dto/update.dto';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly chatService: ChatService,
  ) {}

  async createCommunity(dto: CreateCommunityDto, userId: string) {
    if (dto.type === ChatRole.DIALOG) {
      throw new ForbiddenException('This action is not allowed');
    }

    const user = await this.userService.getById(userId);
    const folderId = user.folders[0].id;

    const community = await this.prisma.chat.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl || '/uploads/avatar/channel-logo.png',
        type: dto.type,
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

    return community;
  }

  async updateCommunity(
    dto: UpdateCommunityDto,
    channelId: string,
    userId: string,
  ) {
    const community = await this.chatService.getChatById(channelId);
    const user = await this.userService.getById(userId);

    if (community.type === ChatRole.DIALOG) {
      throw new ForbiddenException('This action is not allowed');
    }

    const member = community.members.find(
      (member) => member.userId === user.id,
    );

    if (!member) throw new NotFoundException("You don't have rights");

    const isGuestOrModerator =
      member.role === MemberRole.GUEST || member.role === MemberRole.MODERATOR;

    if (isGuestOrModerator)
      throw new ForbiddenException("You don't have rights");

    return this.prisma.chat.update({
      where: {
        id: community.id,
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

  async deleteCommunity(channelId: string, userId: string) {
    const community = await this.chatService.getChatById(channelId);
    const user = await this.userService.getById(userId);

    if (community.type === ChatRole.DIALOG) {
      throw new ForbiddenException('This action is not allowed');
    }

    const member = community.members.find(
      (member) => member.userId === user.id,
    );

    if (!member) throw new NotFoundException("You don't have rights");

    const isOwner = member.role === MemberRole.OWNER;

    if (!isOwner) throw new ForbiddenException("You don't have rights");

    await this.prisma.chat.delete({
      where: {
        id: channelId,
        members: {
          some: {
            userId: user.id,
            role: {
              in: [MemberRole.OWNER],
            },
          },
        },
      },
    });

    return 'Community has been deleted';
  }
}
