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
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create.dto';
import { DeleteChatDto } from './dto/delete.dto';
import { FetchChatsDto } from './dto/fetch.dto';
import { ChatSearchDto } from './dto/search.dto';

@ApiTags('chats')
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Auth()
  @Get()
  async getChats(@User('id') userId: string) {
    return await this.chatService.getChats(userId);
  }

  @Auth()
  @Get('fetch')
  async fetchChats(@Query() dto: FetchChatsDto, @User('id') userId: string) {
    return await this.chatService.fetchChats(dto, userId);
  }

  @Auth()
  @Get('search')
  async searchChatsByQuery(
    @Query() dto: ChatSearchDto,
    @User('id') userId: string,
  ) {
    return await this.chatService.searchChatsByQuery(dto, userId);
  }

  @Auth()
  @Get(':chatId')
  async getChat(@Param('chatId') chatId: string, @User('id') userId: string) {
    return await this.chatService.getChat(chatId, userId);
  }

  @HttpCode(201)
  @Auth()
  @Post()
  async createChat(@Body() dto: CreateChatDto, @User('id') userId: string) {
    return await this.chatService.createChat(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('join/:link')
  async joinChat(@Param('link') link: string, @User('id') userId: string) {
    return await this.chatService.joinChat(link, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('refresh-link/:id')
  async refreshLink(
    @Param('id') communityId: string,
    @User('id') userId: string,
  ) {
    return await this.chatService.refreshLink(communityId, userId);
  }

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  async deleteChat(
    @Body() dto: DeleteChatDto,
    @Param('id') chatId: string,
    @User('id') userId: string,
  ) {
    return await this.chatService.deleteChat(chatId, dto, userId);
  }
}
