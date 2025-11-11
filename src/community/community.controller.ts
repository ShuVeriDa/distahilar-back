import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create.dto';
import { UpdateCommunityDto } from './dto/update.dto';

@ApiTags('communities')
@ApiBearerAuth()
@Controller('communities')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @HttpCode(201)
  @Auth()
  @Post()
  @ApiOperation({ summary: 'Create a new community' })
  @ApiResponse({
    status: 201,
    description: 'The community has been successfully created.',
  })
  @ApiForbiddenResponse({ description: 'This action is not allowed' })
  @ApiBody({ type: CreateCommunityDto })
  async createCommunity(
    @Body() dto: CreateCommunityDto,
    @User('id') userId: string,
  ) {
    return this.communityService.createCommunity(dto, userId);
  }

  @HttpCode(200)
  @Auth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiResponse({
    status: 200,
    description: 'Community has been updated successfully.',
  })
  @ApiBody({ type: UpdateCommunityDto })
  @ApiNotFoundResponse({
    description: "You don't have rights",
  })
  @ApiForbiddenResponse({ description: 'This action is not allowed' })
  async updateCommunity(
    @Body() dto: UpdateCommunityDto,
    @User('id') userId: string,
    @Param('id') communityId: string,
  ) {
    return this.communityService.updateCommunity(dto, communityId, userId);
  }

  @HttpCode(200)
  @Auth()
  @Patch('leave/:id')
  @ApiOperation({ summary: 'Leave community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiResponse({
    status: 200,
    description: 'You have successfully logged out of the community',
  })
  @ApiNotFoundResponse({
    description: 'Community or member not found',
  })
  @ApiForbiddenResponse({ description: 'This action is not allowed' })
  async leaveCommunity(
    @Param('id') communityId: string,
    @User('id') userId: string,
  ) {
    return this.communityService.leaveCommunity(communityId, userId);
  }

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete community' })
  @ApiParam({ name: 'id', description: 'Community ID' })
  @ApiResponse({
    status: 200,
    description: 'Community has been deleted successfully',
  })
  @ApiNotFoundResponse({
    description: "You don't have rights",
  })
  @ApiForbiddenResponse({ description: 'This action is not allowed' })
  async deleteCommunity(
    @Param('id') communityId: string,
    @User('id') userId: string,
  ) {
    return this.communityService.deleteCommunity(communityId, userId);
  }
}
