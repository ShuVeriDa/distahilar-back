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
import { ChangeRoleDto } from './dto/change-role.dto';
import { FetchMemberDto } from './dto/fetch.dto';
import { MemberService } from './member.service';

@ApiTags('members')
@ApiBearerAuth()
@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get(':id')
  @Auth()
  @ApiOperation({ summary: 'List members of chat' })
  @ApiParam({ name: 'id', description: 'Chat identifier' })
  @ApiOkResponse({ description: 'Members retrieved successfully' })
  getMembers(@Param('id') chatId: string) {
    return this.memberService.getMembers(chatId);
  }

  @HttpCode(201)
  @Post(':id')
  @Auth()
  @ApiOperation({ summary: 'Get member details' })
  @ApiParam({ name: 'id', description: 'Member identifier' })
  @ApiOkResponse({ description: 'Member retrieved successfully' })
  async getMember(@Body() dto: FetchMemberDto, @Param('id') memberId: string) {
    return await this.memberService.getMember(dto, memberId);
  }

  @HttpCode(201)
  @Patch(':id')
  @Auth()
  @ApiOperation({ summary: 'Change member role' })
  @ApiParam({ name: 'id', description: 'Member identifier' })
  @ApiOkResponse({ description: 'Member role updated successfully' })
  async changeRole(
    @Body() dto: ChangeRoleDto,
    @Param('id') memberId: string,
    @User('id') userId: string,
  ) {
    return await this.memberService.changeRole(dto, memberId, userId);
  }

  @HttpCode(200)
  @Auth()
  @Delete(':id')
  @ApiOperation({ summary: 'Remove member from chat' })
  @ApiParam({ name: 'id', description: 'Member identifier' })
  @ApiOkResponse({ description: 'Member removed successfully' })
  removeMember(
    @Body() dto: FetchMemberDto,
    @Param('id') memberId: string,
    @User('id') userId: string,
  ) {
    return this.memberService.removeMember(dto, memberId, userId);
  }
}
