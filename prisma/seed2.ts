import { PrismaClient } from '@prisma/client';
import { addReactions } from './helpers/userHelper';

const prisma = new PrismaClient();

async function up() {
  await addReactions(0);
  await addReactions(1);
  await addReactions(2);
  await addReactions(3);
}

async function down() {
  await prisma.$executeRaw`TRUNCATE TABLE "reactions" RESTART IDENTITY CASCADE`;
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
