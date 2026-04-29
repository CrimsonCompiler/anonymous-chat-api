import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import type { Request } from 'express';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
@UseGuards(AuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
  @Post()
  async createRoom(@Body() createRoomDto: CreateRoomDto, @Req() req: Request) {
    const username = req['user'].username;

    return this.roomsService.createRoom(createRoomDto, username);
  }

  @Get()
  async getAllRooms() {
    return this.roomsService.getAllRooms();
  }

  @Get(':id')
  async getRoomById(@Param('id') roomId: string) {
    return this.roomsService.getRoomDetails(roomId);
  }

  @Delete(':id')
  async deleteRoom(@Param('id') roomId: string, @Req() req: Request) {
    const username = req['user'].username;
    return this.roomsService.deleteRoom(roomId, username);
  }
}
