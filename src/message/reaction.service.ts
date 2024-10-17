import { Injectable } from '@nestjs/common';
import { Reaction } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { MessageService } from './message.service';
import { MutatedMessageType, ReactionType } from './message.type';

@Injectable()
export class ReactionService {
  MESSAGES_BATCH = 15;
  constructor(
    private prisma: PrismaService,
    private messageService: MessageService,
  ) {}

  async createReaction(dto: CreateReactionDto, userId: string) {
    const message = await this.messageService.getMessage(
      dto.chatId,
      dto.messageId,
    );

    const reaction = await this.prisma.reaction.findFirst({
      where: {
        messageId: message.id,
        userId: userId,
      },
    });

    let createdMessage: any = [];

    if (reaction) {
      if (reaction.emoji === dto.emoji) {
        createdMessage = await this.prisma.message.update({
          where: {
            id: message.id,
          },
          data: {
            reactions: {
              delete: {
                id: reaction.id,
              },
            },
          },
          include: {
            reactions: true,
            user: true,
          },
        });

        return {
          ...createdMessage,
          reactionCount: this.groupReactionsByEmoji(createdMessage.reactions),
        } as MutatedMessageType;
      }

      createdMessage = await this.prisma.message.update({
        where: {
          id: message.id,
        },
        data: {
          reactions: {
            update: {
              where: {
                id: reaction.id,
              },
              data: {
                emoji: dto.emoji,
              },
            },
          },
        },
        include: {
          reactions: true,
          user: true,
        },
      });

      return {
        ...createdMessage,
        reactionCount: this.groupReactionsByEmoji(createdMessage.reactions),
      } as MutatedMessageType;
    }

    createdMessage = await this.prisma.message.update({
      where: {
        id: message.id,
      },
      data: {
        reactions: {
          create: {
            emoji: dto.emoji,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        },
      },
      include: {
        reactions: true,
        user: true,
      },
    });

    return {
      ...createdMessage,
      reactionCount: this.groupReactionsByEmoji(createdMessage.reactions),
    } as MutatedMessageType;
  }

  private groupReactionsByEmoji(reactions: Reaction[]): ReactionType[] {
    const reactionMap: { [emoji: string]: number } = {};

    // Группируем реакции по эмодзи
    reactions.forEach((reaction) => {
      if (reactionMap[reaction.emoji]) {
        reactionMap[reaction.emoji] += 1;
      } else {
        reactionMap[reaction.emoji] = 1;
      }
    });

    // Преобразуем объект в массив
    const reactionCountArray = Object.entries(reactionMap).map(
      ([emoji, count]) => ({
        emoji,
        count,
      }),
    );

    return reactionCountArray;
  }
}
