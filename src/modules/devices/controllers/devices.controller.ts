import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard.js';
import { AccessLevelGuard } from '../../auth/guard/access-level.guard.js';
import { DevicesService } from '../services/devices.service.js';
import { Access } from '../../auth/decorators/access.decorator.js';
import { GetUserInfo } from '../../auth/decorators/user.info.decorator.js';
import type { IUserInfo } from '../../auth/intefaces/auth.interface.js';
import { DeviceDto } from '../dtos/devices.dto.js';
import { UpdateDeviceDto } from '../dtos/update.device.dto.js';

@Controller('devices')
@UseGuards(AuthGuard, AccessLevelGuard)
export class DevicesController {
  constructor(private readonly deviceService: DevicesService) {}

  // Crear nuevo dispositivo | Create new device
  @Access('ADMIN')
  @Post('register')
  public async createNewDevice(
    @Body() newDeviceData: DeviceDto,
    @GetUserInfo() userInfo: IUserInfo,
  ) {
    return await this.deviceService.createNewDevice(newDeviceData, userInfo);
  }

  // Buscar un dispositivo por el Id | Search for a device by ID
  @Access('ADMIN')
  @Get('find/:deviceId')
  public async findDeviceById(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @GetUserInfo() userInfo: IUserInfo,
  ) {
    return await this.deviceService.findDeviceById(deviceId, userInfo);
  }

  // Actualizar un dispositivo por el Id | Update a device by ID
  @Access('ADMIN')
  @Put('update/:deviceId')
  public async updateDeviceById(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() updateDeviceData: UpdateDeviceDto,
    @GetUserInfo() userInfo: IUserInfo,
  ) {
    return await this.deviceService.updateDeviceById(
      updateDeviceData,
      deviceId,
      userInfo,
    );
  }
}
