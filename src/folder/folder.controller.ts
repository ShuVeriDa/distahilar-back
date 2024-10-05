import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { CreateFolderDto } from './dto/create.dto';
import { FolderService } from './folder.service';

@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @HttpCode(201)
  @Auth()
  @Post()
  async createFolder(@Body() dto: CreateFolderDto, @User('id') userId: string) {
    // return await this.folderService.createFolder(dto, userId);
  }
}
