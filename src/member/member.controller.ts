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
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from 'src/user/decorators/user.decorator';
import { ChangeRoleDto } from './dto/change-role.dto';
import { FetchMemberDto } from './dto/fetch.dto';
import { MemberService } from './member.service';

@ApiTags('members')
@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get(':id')
  @Auth()
  getMembers(@Param('id') chatId: string) {
    return this.memberService.getMembers(chatId);
  }

  @HttpCode(201)
  @Post(':id')
  @Auth()
  async getMember(@Body() dto: FetchMemberDto, @Param('id') memberId: string) {
    return await this.memberService.getMember(dto, memberId);
  }

  @HttpCode(201)
  @Patch(':id')
  @Auth()
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
  removeMember(
    @Body() dto: FetchMemberDto,
    @Param('id') memberId: string,
    @User('id') userId: string,
  ) {
    return this.memberService.removeMember(dto, memberId, userId);
  }
}
