import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from './decorators/user.decorator';
import { ChangeSettingsDto } from './dto/change-settings.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'Get user profile by identifier' })
  @ApiParam({ name: 'id', description: 'User identifier' })
  @ApiNotFoundResponse({
    description: 'The user not found',
  })
  @ApiOkResponse({ description: 'Returns user profile data' })
  async getUserById(@Param('id') userId: string) {
    return this.userService.getUserById(userId);
  }

  @Get(':id/status')
  @Auth()
  @ApiOperation({ summary: 'Get current status of the user' })
  @ApiParam({ name: 'id', description: 'User identifier' })
  @ApiOkResponse({ description: 'Returns user online status' })
  async getUserStatus(@Param('id') userId: string) {
    return this.userService.getUserStatus(userId);
  }

  // @Get('search')
  // async search(@Query('q') query: string) {
  //   return this.getUserById.searchItems(query);
  // }

  @HttpCode(201)
  @Auth()
  @Patch()
  @ApiOperation({ summary: 'Update user profile fields' })
  @ApiOkResponse({ description: 'User profile updated successfully' })
  async updateUser(@Body() dto: UpdateUserDto, @User('id') userId: string) {
    return this.userService.updateUser(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('settings')
  @ApiOperation({ summary: 'Update user notification and language settings' })
  @ApiNotFoundResponse({
    description: 'The user not found',
  })
  @ApiBody({
    description: "Change user's settings",
    type: ChangeSettingsDto,
  })
  @ApiOkResponse({ description: 'User settings updated successfully' })
  async changeSettings(
    @User('id') userId: string,
    @Body() dto: ChangeSettingsDto,
  ) {
    return this.userService.changeSettings(userId, dto);
  }

  @HttpCode(201)
  @Auth()
  @Delete()
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiNotFoundResponse({
    description: 'The user not found',
  })
  @ApiCreatedResponse({
    description: 'The user has been deleted successfully',
  })
  @ApiOkResponse({ description: 'User account deleted successfully' })
  async deleteUser(@User('id') userId: string) {
    return this.userService.deleteUser(userId);
  }
}
