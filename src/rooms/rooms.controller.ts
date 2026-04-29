import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  UseGuards,
  Delete,
  Param,
  HttpCode,
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
  @HttpCode(201)
  async createRoom(@Body() createRoomDto: CreateRoomDto, @Req() req: Request) {
    const username = req['user'].username;

    return this.roomsService.createRoom(createRoomDto, username);
  }

  @Get()
  @HttpCode(200)
  async getAllRooms() {
    return this.roomsService.getAllRooms();
  }

  @Get(':id')
  @HttpCode(200)
  async getRoomById(@Param('id') roomId: string) {
    return this.roomsService.getRoomDetails(roomId);
  }

  @Delete(':id')
  @HttpCode(200)
  async deleteRoom(@Param('id') roomId: string, @Req() req: Request) {
    const username = req['user'].username;
    return this.roomsService.deleteRoom(roomId, username);
  }
}
