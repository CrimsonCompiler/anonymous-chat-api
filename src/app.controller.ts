import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      success: true,
      message: 'Anonymous Chat API is running smoothly! 🚀',
      timestamp: new Date().toISOString(),
      status: 'OK',
    };
  }
}
