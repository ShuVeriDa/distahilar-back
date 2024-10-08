import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create.dto';
import { DeleteChatDto } from './dto/delete.dto';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Auth()
  @Get()
  async getChats(@User('id') userId: string) {
    return await this.chatService.getChats(userId);
  }

  @Auth()
  @Get(':id')
  async getChat(@Param('id') chatId: string) {
    return await this.chatService.getChatById(chatId);
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

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  async deleteChat(
    @Body() dto: DeleteChatDto,
    @Param('id') chatId: string,
    @User('id') userId: string,
  ) {
    return await this.chatService.deleteChat(dto, chatId, userId);
  }
}
