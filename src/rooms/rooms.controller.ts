import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('rooms')
@UseGuards(AuthGuard)
export class RoomsController {
  @Get()
  getAllRooms() {
    return {
      success: true,
      message: 'You have a valid token!. This is protected data',
    };
  }
}
