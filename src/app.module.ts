import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { FolderModule } from './folder/folder.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, UserModule, ChatModule, FolderModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
