import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { DB_CONNECTION } from 'src/database/database.module';
import { CreateRoomDto } from './dto/create-room.dto';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

@Injectable()
export class RoomsService {
  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

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
    const newRoomId = `room_${crypto.randomBytes(4).toString('hex')}`;

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
        createdAt: room.createdAt,
      },
    };
  }
}
