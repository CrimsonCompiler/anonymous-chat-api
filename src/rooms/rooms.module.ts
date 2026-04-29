import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { DatabaseModule } from 'src/database/database.module';
import { RedisModule } from 'src/redis/redis.module';
import {  ChatModule } from 'src/chat/chat.module';

@Module({
  imports:[DatabaseModule, RedisModule,ChatModule],
  providers: [RoomsService],
  controllers: [RoomsController]
})
export class RoomsModule {}
