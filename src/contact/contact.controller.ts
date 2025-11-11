import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ChatSearchDto } from 'src/chat/dto/search.dto';
import { User } from 'src/user/decorators/user.decorator';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create.dto';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Auth()
  @Get()
  @ApiOperation({ summary: 'Search contacts for the authenticated user' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Optional name substring to filter contacts',
  })
  @ApiOkResponse({ description: 'Filtered contacts list' })
  async searchContacts(
    @Query() dto: ChatSearchDto,
    @User('id') userId: string,
  ) {
    return await this.contactService.searchContacts(dto, userId);
  }

  @ApiNotFoundResponse({
    description: 'The Contact not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact ID',
  })
  @Auth()
  @Get(':id')
  @ApiOperation({ summary: 'Get contact details by identifier' })
  @ApiOkResponse({ description: 'Contact details returned successfully' })
  async getContact(@Param('id') contactId: string, @User('id') userId: string) {
    return await this.contactService.getContact(contactId, userId);
  }

  @HttpCode(201)
  @Auth()
  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  @ApiResponse({
    status: 201,
    description: 'The contact has been successfully created.',
  })
  @ApiOkResponse({ description: 'Contact created successfully' })
  @ApiBody({ type: CreateContactDto })
  async createContact(
    @Body() dto: CreateContactDto,
    @User('id') userId: string,
  ) {
    return this.contactService.createContact(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  @ApiResponse({
    status: 201,
    description: 'The contact has been successfully deleted.',
  })
  @ApiOkResponse({ description: 'Contact deleted successfully' })
  async deleteContact(
    @Param('id') interlocutorId: string,
    @User('id') userId: string,
  ) {
    return this.contactService.deleteContact(interlocutorId, userId);
  }
}
