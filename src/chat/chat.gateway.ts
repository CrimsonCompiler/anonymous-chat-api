import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
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

      // Token Checking
      const sessionData = await this.redis.get(`session:${token}`);
      if (!sessionData) {
        throw new Error('Invalid token');
      }
      const user = JSON.parse(sessionData);

      // Room Checking
      const roomCheck = await this.db
        .select()
        .from(schema.rooms)
        .where(eq(schema.rooms.id, roomId));

      if (roomCheck.length === 0) {
        throw new Error('Room not found');
      }

      // Save data into socket
      client.data.user = user;
      client.data.roomId = roomId;

      // Join into socket rooms
      client.join(roomId);

      // Save user as a Active user in Redis Set
      const redisRoomKey = `room:${roomId}:active_users`;
      await this.redis.sadd(redisRoomKey, user.username);

      // getting the list of the active users ( set members )
      const activeUsers = await this.redis.smembers(redisRoomKey);

      client.emit('room:joined', { activeUsers });

      client.broadcast.to(roomId).emit('room:user_joined', {
        username: user.username,
        activeUsers,
      });

      console.log(
        `🟢 Connection Validated! User: ${user.username}, Room: ${roomId}`,
      );
    } catch (error: any) {
      console.log(`🔴 Connection Rejected: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    await this.handleUserLeave(client);
  }

  private async handleUserLeave(client: Socket) {
    const user = client.data.user;
    const roomId = client.data.roomId;

    if (user && roomId) {
      const redisRoomKey = `room:${roomId}:active_users`;

      await this.redis.srem(redisRoomKey, user.username);
      const activeUsers = await this.redis.smembers(redisRoomKey);

      client.broadcast.to(roomId).emit('room:user_left', {
        username: user.username,
        activeUsers,
      });

      console.log(`🔴 ${user.username} left room: ${roomId}`);

      client.data.user = null;
      client.data.roomId = null;
    }
  }
}
