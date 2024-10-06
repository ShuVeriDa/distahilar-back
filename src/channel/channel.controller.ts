import { Body, Controller, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create.dto';
import { UpdateChannelDto } from './dto/update.dto';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @HttpCode(201)
  @Auth()
  @Post()
  async createChannel(
    @Body() dto: CreateChannelDto,
    @User('id') userId: string,
  ) {
    return this.channelService.createChannel(dto, userId);
  }

  @HttpCode(200)
  @Auth()
  @Patch(':id')
  async updateChannel(
    @Body() dto: UpdateChannelDto,
    @User('id') userId: string,
    @Param('id') channelId: string,
  ) {
    return this.channelService.updateChannel(dto, channelId, userId);
  }
}
