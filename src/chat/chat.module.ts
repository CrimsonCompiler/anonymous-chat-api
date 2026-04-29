import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { RedisModule } from 'src/redis/redis.module';
@Module({
  imports: [RedisModule],
  providers: [ChatGateway],
  exports:[ChatGateway]
})
export class ChatModule {}
