import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ChannelModule } from './community/community.module';
import { FileModule } from './file/file.module';
import { FolderModule } from './folder/folder.module';
import { MemberModule } from './member/member.module';
import { MessageModule } from './message/message.module';
import { UserModule } from './user/user.module';
import { CallModule } from './call/call.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    ChatModule,
    FolderModule,
    ChannelModule,
    MemberModule,
    MessageModule,
    FileModule,
    CallModule,
    ContactModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
