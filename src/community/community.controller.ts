import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create.dto';
import { UpdateCommunityDto } from './dto/update.dto';

@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @HttpCode(201)
  @Auth()
  @Post()
  async createCommunity(
    @Body() dto: CreateCommunityDto,
    @User('id') userId: string,
  ) {
    return this.communityService.createCommunity(dto, userId);
  }

  @HttpCode(200)
  @Auth()
  @Patch(':id')
  async updateCommunity(
    @Body() dto: UpdateCommunityDto,
    @User('id') userId: string,
    @Param('id') communityId: string,
  ) {
    return this.communityService.updateCommunity(dto, communityId, userId);
  }

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  async deleteCommunity(
    @Param('id') communityId: string,
    @User('id') userId: string,
  ) {
    return this.communityService.deleteCommunity(communityId, userId);
  }
}
