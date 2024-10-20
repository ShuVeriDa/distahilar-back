import { Message } from '@prisma/client';

export type FoundedChatsType = {
  imageUrl: string;
  name: string;
  lastMessage: Message | null;
  lastMessageDate: Date | null;
  chatId: string;
};
