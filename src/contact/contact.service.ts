import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateContactDto } from './dto/create.dto';
import { ContactSearchDto } from './dto/search.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async searchContacts(dto: ContactSearchDto, userId: string) {
    return await this.prisma.contact.findMany({
      where: {
        OR: [
          {
            savedContact: {
              name: dto.name,
            },
            contactSaver: {
              id: userId,
            },
          },
          {
            savedContact: {
              surname: dto.name,
            },
            contactSaver: {
              id: userId,
            },
          },
          {
            savedContact: {
              username: dto.name,
            },
            contactSaver: {
              id: userId,
            },
          },
        ],
      },
      include: {
        savedContact: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            bio: true,
            email: true,
            phone: true,
            imageUrl: true,
          },
        },
      },
    });
  }

  async getContact(contactId: string, userId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        contactSaver: {
          id: userId,
        },
      },
      include: {
        savedContact: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            bio: true,
            email: true,
            phone: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!contact) throw new NotFoundException('The contact not found.');

    return contact;
  }

  async createContact(dto: CreateContactDto, userId: string) {
    const userContact = await this.userService.getUserById(dto.userId);

    await this.prisma.contact.create({
      data: {
        savedContact: {
          connect: {
            id: userContact.id,
          },
        },
        contactSaver: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return 'The contact has been successfully created.';
  }

  async deleteContact(contactId: string, userId: string) {
    const contact = await this.getContact(contactId, userId);

    await this.prisma.contact.delete({
      where: {
        id: contact.id,
        contactSaver: {
          id: userId,
        },
      },
    });

    return 'The contact has been successfully deleted.';
  }
}
