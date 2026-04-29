import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';
import { DB_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { eq } from 'drizzle-orm';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(DB_CONNECTION) private readonly db: any,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      const roomId = client.handshake.query.roomId as string;

      if (!token || !roomId) {
        throw new Error('Missing token or roomId');
      }

      const sessionData = await this.redis.get(`session:${token}`);
      if (!sessionData) {
        throw new Error('Invalid token');
      }
      const user = JSON.parse(sessionData);

      const roomCheck = await this.db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.id, roomId));

      if (roomCheck.length === 0) {
        throw new Error('Room not found');
      }

      client.data.user = user;
      client.data.roomId = roomId;

      console.log(
        `🟢 Connection Validated! User: ${user.username}, Room: ${roomId}`,
      );
    } catch (error: any) {
      console.log(`🔴 Connection Rejected: ${error.message}`);
      client.disconnect();
    }
  }
}
