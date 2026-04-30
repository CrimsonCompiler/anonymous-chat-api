import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';
import * as schema from '../database/schema';
import { and, desc, eq, lt } from 'drizzle-orm';
import * as crypto from 'crypto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatGateway } from 'src/chat/chat.gateway';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly chatGateway: ChatGateway,
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
        error: { code: 'ROOM_NOT_FOUND', message: `Room with id ${roomId} does not exist` },
      });
    }

    // creating a new message id
    const msgId = `msg_${Math.random().toString(36).substring(2, 10)}`;

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

    this.chatGateway.server.to(roomId).emit('message:new', messageData);

    // response
    return {
      success: true,
      data: messageData,
    };
  }

  async getMessagesByRoomId(roomId: string, limit: number, before?: string) {
    const existingRooms = await this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.id, roomId));

    if (existingRooms.length === 0) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: `Room with id ${roomId} does not exist`,
        },
      });
    }

    const conditions: any[] = [eq(schema.messages.roomId, roomId)];

    if (before) {
      const cursorMsg = await this.db
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.id, before));

      if (cursorMsg.length > 0) {
        conditions.push(lt(schema.messages.createdAt, cursorMsg[0].createdAt));
      }
    }

    const rawMessages = await this.db
      .select()
      .from(schema.messages)
      .where(and(...conditions))
      .orderBy(desc(schema.messages.createdAt))
      .limit(limit + 1);

    const hasMore = rawMessages.length > limit;

    if (hasMore) {
      rawMessages.pop();
    }

    rawMessages.reverse();

    const nextCursor = hasMore ? rawMessages[0].id : null;

    return {
      success: true,
      data: {
        messages: rawMessages.map((msg: any) => ({
          id: msg.id,
          roomId: msg.roomId,
          username: msg.username,
          content: msg.content,
          createdAt: new Date(msg.createdAt).toISOString().split('.')[0] + 'Z',
        })),
        hasMore,
        nextCursor,
      },
    };
  }
}
