import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create.dto';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @HttpCode(201)
  @Auth()
  @Post()
  async createChat(@Body() dto: CreateChatDto, @User('id') userId: string) {
    return await this.chatService.createChat(dto, userId);
  }
}
