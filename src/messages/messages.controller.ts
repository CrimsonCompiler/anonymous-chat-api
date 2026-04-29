import {
  Body,
  Param,
  Post,
  Get,
  Query,
  Req,
  UseGuards,
  Controller,
} from '@nestjs/common';
import type { Request } from 'express';
import { MessagesService } from './messages.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('rooms')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limitQuery?: string,
    @Query('before') before?: string,
  ) {
    let limit = limitQuery ? parseInt(limitQuery, 10) : 50;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    return this.messagesService.getMessagesByRoomId(roomId, limit, before);
  }

  @Post(':roomId/messages')
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() sendMessageDto: SendMessageDto,
    @Req() req: Request,
  ) {
    const { username } = req['user'];
    return this.messagesService.sendMessage(roomId, username, sendMessageDto);
  }
}
