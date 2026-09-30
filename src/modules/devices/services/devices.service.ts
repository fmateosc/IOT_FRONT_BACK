// src/modules/devices/services/devices.service.ts

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DevicesEntity } from '../entities/devices.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceDto } from '../dtos/devices.dto.js';
import { IUserInfo } from '../../auth/intefaces/auth.interface.js';
import { ACCESS_LEVEL } from '../../../constants/index.js';
import { UpdateDeviceDto } from '../dtos/update.device.dto.js';

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

  // Buscar un dispositivo por el Id | Search for a device by ID
  public async findDeviceById(
    deviceId: string,
    userInfo: IUserInfo,
  ): Promise<DevicesEntity> {
    const { userId, userAccess } = userInfo;

    const queryBuilder = this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.createUserId', 'createUserId')
      .where({ id: deviceId });

    if (userAccess === ACCESS_LEVEL.ADMIN) {
      queryBuilder.andWhere('device.createUserId = :createUserId', {
        createUserId: userId,
      });
    }

    const deviceResult = await queryBuilder.getOne();

    if (!deviceResult) {
      throw new HttpException(
        `El dispositivo con Id "${deviceId}" no se encuentra en el sistema`,
        HttpStatus.NOT_FOUND,
      );
    }

    return deviceResult;
  }

  // Actualizar un dispositivo por el Id | Update a device by ID
  public async updateDeviceById(
    updateDeviceData: UpdateDeviceDto,
    deviceId: string,
    userInfo: IUserInfo,
  ): Promise<{ status: boolean; device: DevicesEntity }> {
    const existingDevice = await this.findDeviceById(deviceId, userInfo);

    await this.deviceRepository.update(deviceId, updateDeviceData);

    // TODO: update in EMQX API

    return {
      status: true,
      device: { ...existingDevice, ...updateDeviceData },
    };
  }

  // Eliminar un dispositivo por el Id | Delete a device by ID
  public async deleteDeviceById(
    deviceId: string,
    userInfo: IUserInfo,
  ): Promise<{ status: boolean; device: DevicesEntity }> {
    const existingDevice = await this.findDeviceById(deviceId, userInfo);

    await this.deviceRepository.delete(deviceId);

    return {
      status: true,
      device: existingDevice,
    };
  }
}
