// src/modules/devices/devices.module.ts

import { forwardRef, Module } from '@nestjs/common';
import { DevicesService } from './services/devices.service.js';
import { DevicesController } from './controllers/devices.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesEntity } from './entities/devices.entity.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([DevicesEntity]),
    // users
    forwardRef(() => UsersModule),
  ],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesModule, DevicesService, TypeOrmModule], // export new DevicesService
})
export class DevicesModule {}
