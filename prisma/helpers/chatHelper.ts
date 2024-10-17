import { faker } from '@faker-js/faker';
import {
  ChatRole,
  MemberRole,
  MessageType,
  PrismaClient,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const createChats = async (type: ChatRole, index: number) => {
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

export const createChatForTestUser = async () => {
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

  const userTallar = await prisma.user.findUnique({
    where: {
      username: 'tallarho',
    },
    include: {
      folders: true,
    },
  });

  const dataForCreateChats = [
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
      name: `${userTallar.username}-${users[0].username}`,
      type: ChatRole.DIALOG,
      userId: users[0].id,
    },
    {
      name: `${userTallar.username}-${userShuVeriDa.username}`,
      type: ChatRole.DIALOG,
      userId: users[1].id,
    },
    {
      name: `${userTallar.username}-${users[2].username}`,
      type: ChatRole.DIALOG,
      userId: users[2].id,
    },
  ];

  for (const item of dataForCreateChats) {
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
                    id: userTallar.folders[0].id,
                  },
                  {
                    id: userTallar.folders[1].id,
                  },
                ]
              : [
                  {
                    id: userTallar.folders[0].id,
                  },
                  {
                    id: userTallar.folders[2].id,
                  },
                ],
        },
        members: {
          create:
            item.type === ChatRole.DIALOG
              ? [
                  { userId: userTallar.id, role: MemberRole.GUEST },
                  { userId: item.userId, role: MemberRole.GUEST },
                ]
              : [
                  {
                    userId: userTallar.id,
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

  const messagesBetweenTallarAndShuVeriDa = [
    {
      userId: userTallar.id,
      message: 'Ассаламу 1алайкум',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message: 'Ва1алайкум ассалам',
      type: MessageType.TEXT,
    },
    {
      userId: userTallar.id,
      message: 'Муха ву хьо?',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message: 'Дика ву, Альхьамдулиллах1. Хьо муха ву?',
      type: MessageType.TEXT,
    },
    {
      userId: userTallar.id,
      message: 'Со г1арч1 аьлла ву, Далла бу хастам',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message: 'Делахь ду и дика',
      type: MessageType.TEXT,
    },
    {
      userId: userTallar.id,
      message: 'Керла х1умма дуй?',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message: 'Делахь кхи х1ара аьлла керла х1умма ма дац.',
      type: MessageType.TEXT,
    },
    {
      userId: userTallar.id,
      message: 'Хьан дуй?',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message: 'Иштта хьал ду-кх.',
      type: MessageType.TEXT,
    },
    {
      userId: userTallar.id,
      message: 'Х1инца CS2 ловзуш дуй шу?',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message: 'Дера ду-кх. Х1ора денахь ловзуш хуьлу.',
      type: MessageType.TEXT,
    },
    {
      userId: userTallar.id,
      message: 'Программировании 1ама йеш вуй хьо? Къа хьоьгуш вуй?',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message:
        'Дера ву-кх. Х1ора денахь жима-жима. Иштта а Ингалс мотта а 1ама беш ву со.',
      type: MessageType.TEXT,
    },
    {
      userId: userTallar.id,
      message: 'Иза х1унда 1ама беш бу?',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message:
        'Ингалс мотт хиача: Цкъа далахь балхах кхета атта а хуьлу хьуна, шорта йеша а, 1ама йа а х1ума а хуьлу балхахь оьшуш йолу. Шолг1а далахь аренца болха лахар сихо а хира ду, аренца болу балхахь алсам алап ло, ц1ахь долу чуьнга хьаьжча.',
      type: MessageType.TEXT,
    },
    {
      userId: userTallar.id,
      message:
        'Хьажа и суна ца хаара хьуна. Дала аьтто бойла! Сан дехьа вала везаш нис делла. Йуха а гура ду вай. 1а дика йойла. Ассаламу 1алайка!',
      type: MessageType.TEXT,
    },
    {
      userId: userShuVeriDa.id,
      message:
        'Массери а бойла Дала аьтто! Мегара ду т1аккха. Хаза хийти хьо гина. 1а дика Дала йойла. Ва1алайкумуСсалам!',
      type: MessageType.TEXT,
    },
  ];

  const chatBetweenTallarAndShuVeriDa = await prisma.chat.findFirst({
    where: {
      AND: [
        {
          members: {
            some: {
              user: {
                username: userTallar.username,
              },
            },
          },
        },
        {
          members: {
            some: {
              user: {
                username: userShuVeriDa.username,
              },
            },
          },
        },
      ],
    },
    include: {
      members: true,
    },
  });

  for (const item of messagesBetweenTallarAndShuVeriDa) {
    await prisma.message.create({
      data: {
        userId: item.userId,
        chatId: chatBetweenTallarAndShuVeriDa.id,
        content: item.message,
        messageType: item.type,
      },
      include: {
        chat: true,
        user: true,
        media: true,
        videoMessages: true,
        voiceMessages: true,
        _count: true,
        notifications: true,
        reactions: true,
      },
    });
  }

  //Chat between tallar and someone
  const chatBetweenTallarAndSome = [
    {
      userId: userTallar.id,
      message: faker.lorem.sentences(),
      type: MessageType.TEXT,
    },
    {
      userId: users[1].id,
      message: faker.lorem.sentences(),
      type: MessageType.TEXT,
    },
  ];

  //Messages between tallar and someone
  for (let i = 0; i < 50; i++) {
    await prisma.message.create({
      data: {
        userId:
          i % 2 === 0
            ? chatBetweenTallarAndSome[0].userId
            : chatBetweenTallarAndSome[1].userId,
        chatId: chatBetweenTallarAndShuVeriDa.id,
        content:
          i % 2 === 0
            ? chatBetweenTallarAndSome[0].message
            : chatBetweenTallarAndSome[1].message,
        messageType:
          i % 2 === 0
            ? chatBetweenTallarAndSome[0].type
            : chatBetweenTallarAndSome[1].type,
      },
      include: {
        chat: true,
        user: true,
        media: true,
        videoMessages: true,
        voiceMessages: true,
        _count: true,
        notifications: true,
        reactions: true,
      },
    });
  }

  //Chat 'T1emloyn channel'
  const chatT1emloynChannelMessages = [
    {
      userId: userTallar.id,
      message: faker.lorem.text(),
      type: MessageType.TEXT,
    },
    {
      userId: users[1].id,
      message: faker.lorem.text(),
      type: MessageType.TEXT,
    },
  ];

  const chatT1emloynChannel = await prisma.chat.findFirst({
    where: {
      name: 'T1emloyn channel',
    },
    include: {
      members: true,
    },
  });

  //Messages 'T1emloyn channel'
  for (let i = 0; i < 15; i++) {
    await prisma.message.create({
      data: {
        userId:
          i % 2 === 0
            ? chatT1emloynChannelMessages[0].userId
            : chatT1emloynChannelMessages[1].userId,
        chatId: chatT1emloynChannel.id,
        content:
          i % 2 === 0
            ? chatT1emloynChannelMessages[0].message
            : chatT1emloynChannelMessages[1].message,
        messageType:
          i % 2 === 0
            ? chatT1emloynChannelMessages[0].type
            : chatT1emloynChannelMessages[1].type,
      },
      include: {
        chat: true,
        user: true,
        media: true,
        videoMessages: true,
        voiceMessages: true,
        _count: true,
        notifications: true,
        reactions: true,
      },
    });
  }
};