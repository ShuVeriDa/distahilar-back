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
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from './decorators/user.decorator';
import { ChangeSettingsDto } from './dto/change-settings.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @Auth()
  @ApiNotFoundResponse({
    description: 'The user not found',
  })
  async getUserById(@Param('id') userId: string) {
    return this.userService.getUserById(userId);
  }

  // @Get('search')
  // async search(@Query('q') query: string) {
  //   return this.getUserById.searchItems(query);
  // }

  @HttpCode(201)
  @Auth()
  @Patch()
  async updateUser(@Body() dto: UpdateUserDto, @User('id') userId: string) {
    return this.userService.updateUser(dto, userId);
  }

  @HttpCode(201)
  @Auth()
  @Patch('settings')
  @ApiNotFoundResponse({
    description: 'The user not found',
  })
  @ApiBody({
    description: "Change user's settings",
    type: ChangeSettingsDto,
  })
  async changeSettings(
    @User('id') userId: string,
    @Body() dto: ChangeSettingsDto,
  ) {
    return this.userService.changeSettings(userId, dto);
  }

  @HttpCode(201)
  @Auth()
  @Delete()
  @ApiNotFoundResponse({
    description: 'The user not found',
  })
  @ApiCreatedResponse({
    description: 'The user has been deleted successfully',
  })
  async deleteUser(@User('id') userId: string) {
    return this.userService.deleteUser(userId);
  }
}
