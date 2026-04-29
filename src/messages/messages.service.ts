import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // send a new message
  async sendMessage(roomId: string, username: string, dto: SendMessageDto) {
    const existingRooms = await this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.id, roomId));

    if (existingRooms.length === 0) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' },
      });
    }

    // creating a new message id
    const msgId = `msg_${crypto.randomBytes(4).toString('hex')}`;

    const insertedMessage = await this.db
      .insert(schema.messages)
      .values({
        id: msgId,
        roomId: roomId,
        username: username,
        content: dto.content,
      })
      .returning();

    const msg = insertedMessage[0];

    // API CONTRACT STRUCT
    const messageData = {
      id: msg.id,
      roomId: msg.roomId,
      username: username,
      content: msg.content,
      createdAt: new Date(msg.createdAt).toISOString().split('.')[0] + 'Z',
    };

    // redis publish
    await this.redis.publish(
      `room:${roomId}:messages`,
      JSON.stringify({ event: 'message.new', data: messageData }),
    );

    // response
    return {
      success: true,
      data: messageData,
    };
  }
}
