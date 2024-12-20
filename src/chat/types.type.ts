import { ChatRole, Message } from '@prisma/client';

export type FoundedChatsType = {
  imageUrl: string;
  name: string;
  lastMessage: Message | null;
  lastMessageDate: Date | null;
  lengthUnread: number | null;
  chatId: string;
  lastSeen?: Date | null;
  isOnline?: boolean | undefined | null;
  // isChat: boolean;
  type: ChatRole;
};
