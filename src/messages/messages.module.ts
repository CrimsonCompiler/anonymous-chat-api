import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { DatabaseModule } from '../database/database.module'; 
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [DatabaseModule, RedisModule], 
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
