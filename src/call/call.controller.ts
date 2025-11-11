import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CallService } from './call.service';

@ApiTags('calls')
@ApiBearerAuth()
@Controller('calls')
export class CallController {
  constructor(private readonly callService: CallService) {}

  // @Get(':id')
  // @Auth()
  // async joinCallRoom(@Param('id') roomId: string, @User('id') userId: string) {
  //   return await this.callService.enterCallRoom(roomId, userId);
  // }
}
