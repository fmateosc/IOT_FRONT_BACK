// src/modules/devices/services/devices.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { DevicesEntity } from '../entities/devices.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceDto } from '../dtos/devices.dto.js';
import { IUserInfo } from '../../auth/intefaces/auth.interface.js';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(DevicesEntity)
    private readonly deviceRepository: Repository<DevicesEntity>,
  ) {}

  // Crear nuevo dispositivo | Create new device
  public async createNewDevice(
    newDeviceData: DeviceDto,
    userInfo: IUserInfo,
  ): Promise<{ message: string; device: DevicesEntity }> {
    // Crear entidad inicial | Create initial entity
    const deviceEntity = this.deviceRepository.create({
      ...newDeviceData,
      createUserId: userInfo.userId ? { id: userInfo.userId } : undefined,
    });

    // Guardar dispositivo | Save device
    const savedDevice = await this.deviceRepository.save(deviceEntity);

    const deviceWithUser = await this.deviceRepository.findOne({
      where: { id: savedDevice.id },
      relations: {
        createUserId: true,
      },
    });

    return {
      message: `El dispositivo "${savedDevice.deviceName}" con el serial "${savedDevice.deviceSerial}" se ha creado correctamente`,
      device: savedDevice,
    };
  }
}
