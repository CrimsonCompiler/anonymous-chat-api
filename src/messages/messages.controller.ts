import { Body, Param, Post, Req, UseGuards, Controller } from '@nestjs/common';
import type { Request } from 'express';
import { MessagesService } from './messages.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('rooms')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

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
