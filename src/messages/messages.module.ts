import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from '../database/database.module'; 
import { RedisModule } from '../redis/redis.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [DatabaseModule, RedisModule, ChatModule], 
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
