import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // getting the token from the header
    const token = this.extractTokenFromHeader(request);

    // if no token found then throw an error
    if (!token) {
      this.throwUnauthorizedError();
    }

    // checking from the redis too
    const sessionData = await this.redis.get(`session:${token}`);

    if (!sessionData) {
      this.throwUnauthorizedError();
    }

    // if all okay then save the data into requestObject
    // easier to get data from the request
    request['user'] = JSON.parse(sessionData as string);

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private throwUnauthorizedError(): never {
    throw new UnauthorizedException({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or expired session token',
      },
    });
  }
}
