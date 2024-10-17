import { Message } from '@prisma/client';

export type ReactionType = {
  emoji: string;
  count: number;
};

export type MutatedMessageType = {
  reactionCount: ReactionType[];
} & Message;
