import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { FolderModule } from './folder/folder.module';
import { ChannelModule } from './channel/channel.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UserModule, ChatModule, FolderModule, ChannelModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
