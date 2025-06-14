import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { MessageService } from './message.service';
import { MutatedMessageType, ReactionType } from './message.type';

@Injectable()
export class ReactionService {
  constructor(
    private prisma: PrismaService,
    private messageService: MessageService,
  ) {}

  async createReaction(dto: CreateReactionDto, userId: string) {
    const message = await this.messageService.getMessage(
      dto.chatId,
      dto.messageId,
    );

    // 1. Есть ли уже реакция от пользователя на это сообщение?
    const existingReactionUser = await this.prisma.reactionUser.findFirst({
      where: {
        userId,
        reaction: {
          messageId: message.id,
        },
      },
      include: {
        reaction: true,
      },
    });

    // 2. Если пользователь уже ставил ту же реакцию — удаляем
    if (
      existingReactionUser &&
      existingReactionUser.reaction.emoji === dto.emoji
    ) {
      await this.prisma.reactionUser.delete({
        where: {
          userId_reactionId: {
            userId,
            reactionId: existingReactionUser.reactionId,
          },
        },
      });

      // Уменьшаем count или удаляем реакцию
      const remainingCount = await this.prisma.reactionUser.count({
        where: {
          reactionId: existingReactionUser.reactionId,
        },
      });

      if (remainingCount === 0) {
        await this.prisma.reaction.delete({
          where: { id: existingReactionUser.reactionId },
        });
      } else {
        await this.prisma.reaction.update({
          where: { id: existingReactionUser.reactionId },
          data: { count: remainingCount },
        });
      }

      const updatedMessage = await this.getMessageWithReactions(message.id);
      return {
        ...updatedMessage,
        reactionCount: this.groupReactionsByEmoji(updatedMessage.reactions),
      } as MutatedMessageType;
    }

    // 3. Если пользователь ставил другую реакцию — заменяем
    if (
      existingReactionUser &&
      existingReactionUser.reaction.emoji !== dto.emoji
    ) {
      await this.prisma.reactionUser.delete({
        where: {
          userId_reactionId: {
            userId,
            reactionId: existingReactionUser.reactionId,
          },
        },
      });

      const oldCount = await this.prisma.reactionUser.count({
        where: { reactionId: existingReactionUser.reactionId },
      });

      if (oldCount === 0) {
        await this.prisma.reaction.delete({
          where: { id: existingReactionUser.reactionId },
        });
      } else {
        await this.prisma.reaction.update({
          where: { id: existingReactionUser.reactionId },
          data: { count: oldCount },
        });
      }
    }

    // 4. Проверяем, есть ли реакция с этим emoji
    let reaction = await this.prisma.reaction.findFirst({
      where: {
        messageId: message.id,
        emoji: dto.emoji,
      },
    });

    // 5. Если нет — создаём с count = 1
    if (!reaction) {
      reaction = await this.prisma.reaction.create({
        data: {
          emoji: dto.emoji,
          messageId: message.id,
          count: 1,
        },
      });
    } else {
      // Иначе увеличиваем count
      await this.prisma.reaction.update({
        where: { id: reaction.id },
        data: {
          count: { increment: 1 },
        },
      });
    }

    // 6. Привязываем пользователя
    await this.prisma.reactionUser.create({
      data: {
        userId,
        reactionId: reaction.id,
      },
    });

    const updatedMessage = await this.getMessageWithReactions(message.id);
    return {
      ...updatedMessage,
      reactionCount: this.groupReactionsByEmoji(updatedMessage.reactions),
    } as MutatedMessageType;
  }

  private groupReactionsByEmoji(reactions: any[]): ReactionType[] {
    const map: Record<string, number> = {};

    reactions.forEach((r) => {
      if (map[r.emoji]) {
        map[r.emoji] += 1;
      } else {
        map[r.emoji] = 1;
      }
    });

    return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
  }

  async getMessageWithReactions(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: true,
        reactions: {
          include: {
            users: true, // это ReactionUser[]
          },
        },
      },
    });
  }
}
