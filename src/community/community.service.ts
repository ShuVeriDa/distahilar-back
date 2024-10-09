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

    await this.prisma.chat.create({
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

    return 'The community has been successfully created.';
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

    await this.prisma.chat.update({
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

    return 'Community has been updated successfully.';
  }

  async leaveCommunity(channelId: string, userId: string) {
    const community = await this.prisma.chat.findFirst({
      where: {
        id: channelId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!community)
      throw new NotFoundException('Community or member not found');

    if (community.type === ChatRole.DIALOG) {
      throw new ForbiddenException('This action is not allowed');
    }

    const user = await this.userService.getById(userId);

    const member = community.members.find(
      (member) => member.userId === user.id,
    );

    const isOwner = member.role === MemberRole.OWNER;

    if (isOwner)
      throw new ForbiddenException('The owner сan only delete the server');

    await this.prisma.chat.update({
      where: {
        id: channelId,
        members: {
          some: {
            id: member.id,
            userId: user.id,
          },
        },
      },
      data: {
        members: {
          delete: {
            id: member.id,
            userId: user.id,
            NOT: {
              role: MemberRole.OWNER,
            },
          },
        },
      },
    });

    return 'You have successfully logged out of the community';
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

    return 'Community has been deleted successfully';
  }
}
