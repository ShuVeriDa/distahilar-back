import { Body, Controller, Delete, HttpCode, Patch } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from './decorators/user.decorator';
import { ChangeSettingsDto } from './dto/change-settings.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(200)
  @Auth()
  @Patch('settings')
  async changeSettings(
    @User('id') userId: string,
    @Body() dto: ChangeSettingsDto,
  ) {
    return this.userService.changeSettings(userId, dto);
  }

  @HttpCode(200)
  @Auth()
  @Delete()
  async deleteUser(@User('id') userId: string) {
    return this.userService.deleteUser(userId);
  }
}
