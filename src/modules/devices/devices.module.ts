import { Module } from '@nestjs/common';
import { DevicesService } from './services/devices.service.js';
import { DevicesController } from './controllers/devices.controller.js';

@Module({
  providers: [DevicesService],
  controllers: [DevicesController]
})
export class DevicesModule {}
