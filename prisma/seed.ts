import { faker } from '@faker-js/faker';
import { ChatRole, Language, MemberRole, PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const createTestUser = async () => {
  const users = [
    {
      email: 'tallar@tallar.du',
      name: 'Tallarho Vu So',
      username: 'tallarho',
      language: Language.EN,
    },
    {
      email: 'biltoy@nakhcho.vu',
      name: 'Said-Muhammad Biltoy',
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
            },
            {
              name: 'Personal',
            },
            {
              name: 'Channels and Groups',
            },
          ],
        },
      },
    });
  }
};

const createdUsers = async () => {
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
};

const createChats = async (type: ChatRole, index: number) => {
  const users = await prisma.user.findMany({
    where: {
      username: {
        not: 'tallarho',
      },
    },
    include: {
      folders: true,
    },
  });

  await prisma.chat.create({
    data: {
      name: faker.company.name(),
      link: uuidv4(),
      description: faker.company.catchPhraseDescriptor(),
      imageUrl: faker.image.avatar(),
      type: type,
      folders: {
        connect: {
          id: users[index].folders[0].id,
        },
      },
      members: {
        create: users.map((user, i) => ({
          userId: user.id,
          role:
            i === index
              ? MemberRole.OWNER
              : i === index + 1
                ? MemberRole.ADMIN
                : i === index + 2 || i === index + 3
                  ? MemberRole.MODERATOR
                  : MemberRole.GUEST,
        })),
      },
    },
  });
};

const createChatForTestUser = async () => {
  const users = await prisma.user.findMany({
    where: {
      username: {
        not: 'tallarho',
      },
    },
    include: {
      folders: true,
    },
  });

  const userShuVeriDa = await prisma.user.findUnique({
    where: {
      username: 'shuverida',
    },
    include: {
      folders: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      username: 'tallarho',
    },
    include: {
      folders: true,
    },
  });

  const items = [
    {
      name: 'T1emloyn channel',
      type: ChatRole.CHANNEL,
      description: 'Х1ара CS2 т1емлойн канал ду',
    },
    {
      name: 'K1amelan gullam',
      type: ChatRole.GROUP,
      description: 'Х1ара къамелан гуллам бу',
    },
    {
      name: `${user.username}-${users[0].username}`,
      type: ChatRole.DIALOG,
      userId: users[0].id,
    },
    {
      name: `${user.username}-${userShuVeriDa.username}`,
      type: ChatRole.DIALOG,
      userId: users[1].id,
    },
    {
      name: `${user.username}-${users[2].username}`,
      type: ChatRole.DIALOG,
      userId: users[2].id,
    },
  ];

  for (const item of items) {
    await prisma.chat.create({
      data: {
        name: item.name,
        link: uuidv4(),
        type: item.type,
        description: item.description,
        imageUrl: faker.image.avatar(),
        folders: {
          connect:
            item.type === ChatRole.DIALOG
              ? [
                  {
                    id: user.folders[0].id,
                  },
                  {
                    id: user.folders[1].id,
                  },
                ]
              : [
                  {
                    id: user.folders[0].id,
                  },
                  {
                    id: user.folders[2].id,
                  },
                ],
        },
        members: {
          create:
            item.type === ChatRole.DIALOG
              ? [
                  { userId: user.id, role: MemberRole.GUEST },
                  { userId: item.userId, role: MemberRole.GUEST },
                ]
              : [
                  {
                    userId: user.id,
                    role: MemberRole.OWNER,
                  },
                  ...users.map((user, i) => ({
                    userId: user.id,
                    role:
                      i === 0
                        ? MemberRole.ADMIN
                        : i === 1 || i === 2
                          ? MemberRole.MODERATOR
                          : MemberRole.GUEST,
                  })),
                ],
        },
      },
    });
  }
};

async function up() {
  const FAKER_ROUNDS_USERS = 20;
  const FAKER_ROUNDS_CHATS_CHANNEL = 4;
  const FAKER_ROUNDS_CHATS_GROUP = 2;
  dotenv.config();

  for (let i = 0; i < FAKER_ROUNDS_USERS; i++) {
    await createdUsers();
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
  await prisma.$executeRaw`TRUNCATE TABLE "folders" RESTART IDENTITY CASCADE`;
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
