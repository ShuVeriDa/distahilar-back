import { faker } from '@faker-js/faker';
import { Language, PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import * as dotenv from 'dotenv';

const prisma = new PrismaClient();

async function up() {
  const FAKER_ROUNDS = 10;
  dotenv.config();
  await prisma.user.create({
    data: {
      email: 'tallar@tallar.du',
      password: await hash('123456Bb.'),
      name: 'Tallarho Vu So',
      username: 'tallarho',
      phone: faker.phone.number(),
      bio: faker.person.bio(),
      imageUrl: faker.image.avatar(),
      settings: {
        create: {
          language: Language.EN,
        },
      },
      folders: {
        create: [
          {
            name: 'All chats',
          },
        ],
      },
    },
  });

  for (let i = 0; i < FAKER_ROUNDS; i++) {
    await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: await hash(faker.internet.password()),
        name: faker.person.fullName(),
        username: faker.internet.userName().toLowerCase(),
        phone: faker.phone.number(),
        bio: faker.person.bio(),
        imageUrl: faker.image.avatar(),
        settings: {
          create: {
            language: Language.EN,
          },
        },
        folders: {
          create: [
            {
              name: 'All chats',
            },
          ],
        },
      },
    });
  }
}

async function down() {
  await prisma.$executeRaw`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE`;
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
