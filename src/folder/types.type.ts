import { User } from '@prisma/client';
import { FoundedChatsType } from 'src/chat/types.type';

export type FolderWSType = {
  id: string;
  name: string;
  imageUrl: string;
  chats: FoundedChatsType[];
  userId: string;
  user?: User;
};
