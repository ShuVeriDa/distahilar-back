import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create.dto';
import { DeleteChatDto } from './dto/delete.dto';
import { FetchChatsDto } from './dto/fetch.dto';
import { ChatSearchDto } from './dto/search.dto';

@ApiTags('chats')
@ApiBearerAuth()
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Auth()
  @Get()
  @ApiOperation({ summary: 'List chats for the authenticated user' })
  @ApiOkResponse({ description: 'List of chats for current user' })
  async getChats(@User('id') userId: string) {
    return await this.chatService.getChats(userId);
  }

  @Auth()
  @Get('fetch')
  @ApiOperation({ summary: 'Fetch chats with pagination' })
  @ApiQuery({
    name: 'folder',
    required: true,
    description: 'Folder identifier to fetch chats from',
  })
  @ApiOkResponse({ description: 'Paginated chunk of chats' })
  async fetchChats(@Query() dto: FetchChatsDto, @User('id') userId: string) {
    return await this.chatService.fetchChats(dto, userId);
  }

  @Auth()
  @Get('search')
  @ApiOperation({ summary: 'Search chats by name query' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Search query for chat name',
  })
  @ApiOkResponse({ description: 'Filtered chats by query' })
  async searchChatsByQuery(
    @Query() dto: ChatSearchDto,
    @User('id') userId: string,
  ) {
    return await this.chatService.searchChatsByQuery(dto, userId);
  }

  @Auth()
  @Get(':chatId')
  @ApiOperation({ summary: 'Get chat by identifier' })
  @ApiParam({ name: 'chatId', description: 'Chat identifier' })
  @ApiOkResponse({ description: 'Chat data with members' })
  async getChat(@Param('chatId') chatId: string, @User('id') userId: string) {
    return await this.chatService.getChat(chatId, userId);
  }

  @HttpCode(201)
  @Auth()
  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiOkResponse({ description: 'Chat created successfully' })
  async createChat(@Body() dto: CreateChatDto, @User('id') userId: string) {
    return await this.chatService.createChat(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('join/:link')
  @ApiOperation({ summary: 'Join chat via invite link' })
  @ApiParam({ name: 'link', description: 'Invite link' })
  @ApiOkResponse({ description: 'User joined chat successfully' })
  async joinChat(@Param('link') link: string, @User('id') userId: string) {
    return await this.chatService.joinChat(link, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('refresh-link/:id')
  @ApiOperation({ summary: 'Refresh chat invite link' })
  @ApiParam({ name: 'id', description: 'Chat identifier' })
  @ApiOkResponse({ description: 'New invite link generated' })
  async refreshLink(
    @Param('id') communityId: string,
    @User('id') userId: string,
  ) {
    return await this.chatService.refreshLink(communityId, userId);
  }

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete chat for the current user' })
  @ApiParam({ name: 'id', description: 'Chat identifier' })
  @ApiOkResponse({ description: 'Chat deleted successfully' })
  async deleteChat(
    @Body() dto: DeleteChatDto,
    @Param('id') chatId: string,
    @User('id') userId: string,
  ) {
    return await this.chatService.deleteChat(chatId, dto, userId);
  }
}
