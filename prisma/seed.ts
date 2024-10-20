import { ChatRole, PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { createChatForTestUser, createChats } from './helpers/chatHelper';
import { createTestUser, createUsers } from './helpers/userHelper';

const prisma = new PrismaClient();

async function up() {
  const FAKER_ROUNDS_USERS = 100;
  const FAKER_ROUNDS_CHATS_CHANNEL = 4;
  const FAKER_ROUNDS_CHATS_GROUP = 2;
  dotenv.config();

  for (let i = 0; i < FAKER_ROUNDS_USERS; i++) {
    await createUsers();
  }

  await createTestUser();
  await createChatForTestUser();

  for (let i = 0; i < FAKER_ROUNDS_CHATS_CHANNEL; i++) {
    await createChats(ChatRole.CHANNEL, i);
  }

  for (let i = 0; i < FAKER_ROUNDS_CHATS_GROUP; i++) {
    await createChats(ChatRole.GROUP, i);
  }
}

async function down() {
  await prisma.$executeRaw`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "chats" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "messages" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "folders" RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "chat_members" RESTART IDENTITY CASCADE`;
}

async function main() {
  try {
    await down();
    await up();
  } catch (error) {
    console.error(error);
  }
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
