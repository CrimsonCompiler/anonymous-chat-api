import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DB_CONNECTION } from 'src/database/database.module';
import { CreateRoomDto } from './dto/create-room.dto';
import * as schema from '../database/schema';
import { desc, eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { ChatGateway } from 'src/chat/chat.gateway';
import Redis from 'ioredis';

@Injectable()
export class RoomsService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto, username: string) {
    const { name } = createRoomDto;

    // Checking for the existing room name
    const existingRooms = await this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.name, name));

    if (existingRooms.length > 0) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'ROOM_NAME_TAKEN',
          message: 'A room with this already exists',
        },
      });
    }

    // Saving to db if not exists
    const newRoomId = `room_${Math.random().toString(36).substring(2, 10)}`;

    const insertedRooms = await this.db
      .insert(schema.rooms)
      .values({
        id: newRoomId,
        name: name,
        createdBy: username,
      })
      .returning();

    const room = insertedRooms[0];

    return {
      success: true,
      data: {
        id: room.id,
        name: room.name,
        createdBy: room.createdBy,
        createdAt: new Date(room.createdAt).toISOString().split('.')[0] + 'Z',
      },
    };
  } 

  async getAllRooms() {
    const allRooms = await this.db
      .select()
      .from(schema.rooms)
      .orderBy(desc(schema.rooms.createdAt));

    return {
      success: true,
      data: {
        rooms: allRooms.map((room) => ({
          id: room.id,
          name: room.name,
          cratedBy: room.createdBy,
          activeUsers: 0,
          createdAt: new Date(room.createdAt).toISOString().split('.')[0] + 'Z',
        })),
      },
    };
  }

  async deleteRoom(roomId: string, username: string) {
    const existingRooms = await this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.id, roomId));

    const room = existingRooms[0];

    if (!room) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: `Room with id ${room.id} does not exist`,
        },
      });
    }

    if (room.createdBy !== username) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only the room creator can delete this room',
        },
      });
    }

    // if all okay
    await this.db.delete(schema.rooms).where(eq(schema.rooms.id, roomId));

    // Broadcast with socket.io
    this.chatGateway.server.to(roomId).emit('room:deleted', { roomId });

    // ^-^ forcefully remove the clients
    this.chatGateway.server.in(roomId).disconnectSockets();

    return {
      success: true,
      data: {
        deleted: true,
      },
    };
  }

  async getRoomDetails(roomId: string) {
    const existingRooms = await this.db
      .select()
      .from(schema.rooms)
      .where(eq(schema.rooms.id, roomId));

    const room = existingRooms[0];

    if (!room) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'ROOM_NOT_FOUND',
          message: `Room with id ${room.id} does not exist`,
        },
      });
    }

    return {
      success: true,
      data: {
        id: room.id,
        name: room.name,
        createdBy: room.createdBy,
        activeUsers: 0,
        createdAt: room.createdAt,
      },
    };
  }
}
