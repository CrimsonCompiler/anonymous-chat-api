import { REDIS_CLIENT } from './../redis/redis.module';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION } from 'src/database/database.module';
import { LoginDto } from './dto/login.dto';
import * as schema from '../database/schema';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async login(loginDto: LoginDto) {
    const { username } = loginDto;

    // checking if the user already exists or not
    const existingUsers = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username));

    let user = existingUsers[0];

    // Create a new user if not found this user
    if (!user) {
      const newUserId = `usr_${randomBytes(4).toString('hex')}`;
      const insertedUsers = await this.db
        .insert(schema.users)
        .values({
          id: newUserId,
          username,
        })
        .returning();

      user = insertedUsers[0];
    }

    // Create a Session token
    const sessionToken = randomBytes(32).toString('hex');

    // Time limit of the token
    const ttlInSeconds = 24 * 60 * 60;
    await this.redis.set(
      `session:${sessionToken}`,
      JSON.stringify({ id: user.id, username: user.username }),
      'EX',
      ttlInSeconds,
    );

    return {
      success: true,
      data: {
        sessionToken: sessionToken,
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
        },
      },
    };
  }
}
