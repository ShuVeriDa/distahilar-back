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
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { ChatToFolderDto } from './dto/chat-to-folder.dto';
import { CreateFolderDto } from './dto/create.dto';
import { UpdateFolderDto } from './dto/update.dto';
import { FolderService } from './folder.service';

@ApiTags('folders')
@ApiBearerAuth()
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Auth()
  @Get()
  @ApiOperation({ summary: 'List folders for the current user' })
  @ApiOkResponse({ description: 'List of folders retrieved successfully' })
  async fetchFolders(@User('id') userId: string) {
    return await this.folderService.fetchFolders(userId);
  }

  @Auth()
  @Get(':id')
  @ApiOperation({ summary: 'Get folder details by identifier' })
  @ApiParam({ name: 'id', description: 'Folder identifier' })
  @ApiOkResponse({ description: 'Folder retrieved successfully' })
  async getFolderById(
    @Param('id') folderId: string,
    @User('id') userId: string,
  ) {
    return await this.folderService.getFolderById(folderId, userId);
  }

  @HttpCode(201)
  @Auth()
  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiOkResponse({ description: 'Folder created successfully' })
  async createFolder(@Body() dto: CreateFolderDto, @User('id') userId: string) {
    return await this.folderService.createFolder(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('add-chat')
  @ApiOperation({ summary: 'Attach chats to a folder' })
  @ApiOkResponse({ description: 'Chats added to folder successfully' })
  async addChatToFolder(
    @Body() dto: ChatToFolderDto,
    @User('id') userId: string,
  ) {
    return await this.folderService.addChatToFolder(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('remove-chat')
  @ApiOperation({ summary: 'Remove chats from a folder' })
  @ApiOkResponse({ description: 'Chats removed from folder successfully' })
  async removeChatFromFolder(
    @Body() dto: ChatToFolderDto,
    @User('id') userId: string,
  ) {
    return await this.folderService.removeChatToFolder(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update folder metadata' })
  @ApiParam({ name: 'id', description: 'Folder identifier' })
  @ApiOkResponse({ description: 'Folder updated successfully' })
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
  @ApiOperation({ summary: 'Delete folder by identifier' })
  @ApiParam({ name: 'id', description: 'Folder identifier' })
  @ApiOkResponse({ description: 'Folder deleted successfully' })
  async deleteFolder(
    @Param('id') folderId: string,
    @User('id') userId: string,
  ) {
    return await this.folderService.deleteFolder(folderId, userId);
  }
}
