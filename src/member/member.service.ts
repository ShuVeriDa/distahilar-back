import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatRole, MemberRole } from '@prisma/client';
import { ChatService } from 'src/chat/chat.service';
import { PrismaService } from 'src/prisma.service';
import { ChangeRoleDto } from './dto/change-role.dto';
import { FetchMemberDto } from './dto/fetch.dto';

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async getMembers(chatId: string) {
    const chat = await this.chatService.getChatById(chatId);

    const isDialog = chat.type === ChatRole.DIALOG;

    if (isDialog) {
      throw new ForbiddenException('This action is not allowed');
    }

    const members = await this.prisma.chatMember.findMany({
      where: {
        chatId: chat.id,
      },
      include: {
        user: true,
        chat: true,
      },
    });

    return members;
  }

  async getMember(dto: FetchMemberDto, memberId: string) {
    const chat = await this.chatService.getChatById(dto.chatId);

    const isDialog = chat.type === ChatRole.DIALOG;

    if (isDialog) {
      throw new ForbiddenException('This action is not allowed');
    }

    const member = await this.prisma.chatMember.findFirst({
      where: {
        id: memberId,
        chatId: chat.id,
      },
      include: {
        user: true,
        chat: true,
      },
    });

    if (!member) throw new NotFoundException('Member not found');

    return { chat, member };
  }

  async changeRole(dto: ChangeRoleDto, memberId: string, userId: string) {
    if (dto.role === MemberRole.OWNER) {
      throw new ForbiddenException("The 'OWNER' role cannot be given to users");
    }

    const { member, user } = await this.validateMember(dto, memberId, userId);

    return await this.prisma.chat.update({
      where: {
        id: dto.chatId,
      },
      data: {
        members: {
          update: {
            where: {
              id: member.id,
              NOT: [
                {
                  role: MemberRole.OWNER,
                },
                {
                  userId: user.id,
                },
              ],
            },
            data: {
              role: dto.role,
            },
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async removeMember(dto: FetchMemberDto, memberId: string, userId: string) {
    const { member, user } = await this.validateMember(dto, memberId, userId);

    const isOwner = member.role === MemberRole.OWNER;

    if (!isOwner) throw new ForbiddenException("You don't have rights");

    await this.prisma.chat.update({
      where: {
        id: dto.chatId,
      },
      data: {
        members: {
          delete: {
            id: member.id,
            NOT: [
              {
                role: MemberRole.OWNER,
              },
              {
                userId: user.id,
              },
            ],
          },
        },
      },
      include: {
        members: true,
      },
    });

    return 'Member has been removed successfully';
  }

  private async validateMember(
    dto: FetchMemberDto,
    memberId: string,
    userId: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    const { member, chat } = await this.getMember(dto, memberId);

    const roleOfUser = await this.prisma.chatMember.findFirst({
      where: {
        chatId: chat.id,
        userId: user.id,
      },
    });

    const isPossibleToChangeRole =
      roleOfUser.role === MemberRole.OWNER ||
      roleOfUser.role === MemberRole.ADMIN;

    if (!isPossibleToChangeRole) {
      throw new ForbiddenException("You don't have rights");
    }

    if (
      member.role === MemberRole.ADMIN &&
      roleOfUser.role === MemberRole.ADMIN
    ) {
      throw new ForbiddenException(
        'An administrator cannot deprive another administrator of his role',
      );
    }

    return { member, user };
  }
}
