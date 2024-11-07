import { faker } from '@faker-js/faker';
import { Language, PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

export const createTestUser = async () => {
  const users = [
    {
      email: 'tallar@tallar.du',
      name: 'Tallarho Vu So',
      surname: '...',
      username: 'tallarho',
      language: Language.EN,
    },
    {
      email: 'biltoy@nakhcho.vu',
      name: 'Said-Muhammad Biltoy',
      surname: 'Almurzaev',
      username: 'shuverida',
      language: Language.CHE,
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        email: user.email,
        password: await hash('123456Bb.'),
        name: user.name,
        surname: user.surname,
        username: user.username,
        phone: faker.phone.number(),
        bio: faker.person.bio(),
        imageUrl: faker.image.avatar(),
        settings: {
          create: {
            language: user.language,
          },
        },
        folders: {
          create: [
            {
              name: 'All chats',
              imageUrl: 'AllChats',
            },
            {
              name: 'Personal',
              imageUrl: 'User',
            },
            {
              name: 'Channels and Groups',
              imageUrl: 'Megaphone',
            },
          ],
        },
      },
    });
  }
};

export const createUsers = async () => {
  await prisma.user.create({
    data: {
      email: faker.internet.email(),
      password: await hash(faker.internet.password()),
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
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
            imageUrl: 'AllChats',
          },
        ],
      },
    },
  });
};
