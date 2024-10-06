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
import { ChatToFolderDto } from './dto/chat-to-folder.dto';
import { CreateFolderDto } from './dto/create.dto';
import { UpdateFolderDto } from './dto/update.dto';
import { FolderService } from './folder.service';

@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Auth()
  @Get()
  async fetchFolders(@User('id') userId: string) {
    return await this.folderService.fetchFolders(userId);
  }

  @Auth()
  @Get(':id')
  async getFolderById(
    @Param('id') folderId: string,
    @User('id') userId: string,
  ) {
    return await this.folderService.getFolderById(folderId, userId);
  }

  @HttpCode(201)
  @Auth()
  @Post()
  async createFolder(@Body() dto: CreateFolderDto, @User('id') userId: string) {
    return await this.folderService.createFolder(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('add-chat')
  async addChatToFolder(
    @Body() dto: ChatToFolderDto,
    @User('id') userId: string,
  ) {
    return await this.folderService.addChatToFolder(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('remove-chat')
  async removeChatFromFolder(
    @Body() dto: ChatToFolderDto,
    @User('id') userId: string,
  ) {
    return await this.folderService.removeChatToFolder(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch(':id')
  async updateFolder(
    @Body() dto: UpdateFolderDto,
    @Param('id') folderId: string,
    @User('id') userId: string,
  ) {
    return await this.folderService.updateFolder(dto, folderId, userId);
  }

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  async deleteFolder(
    @Param('id') folderId: string,
    @User('id') userId: string,
  ) {
    return await this.folderService.deleteFolder(folderId, userId);
  }
}
