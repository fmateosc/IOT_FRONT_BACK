// src/modules/devices/services/devices.service.ts

import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DevicesEntity } from '../entities/devices.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceDto } from '../dtos/devices.dto.js';
import { IUserInfo } from '../../auth/intefaces/auth.interface.js';
import { ACCESS_LEVEL } from '../../../constants/index.js';
import { UpdateDeviceDto } from '../dtos/update.device.dto.js';
import { PaginationDto } from '../../../common/dtos/pagination.dto.js';
import { EmqxApiService } from '../../providers/http/emqx-api.service.js';
import { IEmqxBannedResponseData } from '../../../common/interfaces/emqx.interface.js';
@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(DevicesEntity)
    private readonly deviceRepository: Repository<DevicesEntity>,
    @Inject(forwardRef(() => EmqxApiService))
    private readonly httpEmqxApiService: EmqxApiService,
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
      relations: { createUserId: true },
    });

    if (
      savedDevice &&
      (await this.httpEmqxApiService.ensureSettingsInitialized())
    ) {
      const [respEmqxBridge, bannedList] = await Promise.all([
        this.httpEmqxApiService.emqxApiPostBridge({
          name: savedDevice.deviceName,
          user: deviceWithUser?.createUserId?.username || 'emqx', // ← usar deviceWithUser
          serialId: savedDevice.deviceSerial,
        }),
        this.httpEmqxApiService.emqxApiGetBannedList(),
      ]);

      await this.updateDeviceById(
        {
          bridgeRuleId: `${respEmqxBridge.type}:${respEmqxBridge.name}`,
        },
        savedDevice.id,
        userInfo,
      );

      await this.checkWhoParameter(bannedList, newDeviceData.deviceSerial);
    }

    return {
      message: `El dispositivo "${savedDevice.deviceName}" con el serial "${savedDevice.deviceSerial}" se ha creado correctamente`,
      device: savedDevice,
    };
  }

  // Eliminar de la lista de baneados si existe | Remove from the banned list if it exists
  private async checkWhoParameter(
    response: IEmqxBannedResponseData,
    whoParam: string,
  ): Promise<void> {
    const bannedSet = new Set(response.data.map((item) => item.who));
    if (bannedSet.has(whoParam)) {
      await this.httpEmqxApiService.emqxApiDeleteBanned({
        as: 'clientid',
        who: whoParam,
      });
    }
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
    if (updateDeviceData.deviceStatus && !updateDeviceData.bridgeRuleId) {
      await this.httpEmqxApiService.emqxApiDeleteBanned({
        as: 'clientid',
        who: existingDevice.deviceSerial,
      });
    } else if (!updateDeviceData.bridgeRuleId) {
      await this.httpEmqxApiService.emqxApiPostAddBanned({
        as: 'clientid',
        who: existingDevice.deviceSerial,
        reason: 'Disabled by uUser',
      });
    }

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

    // Delete de bridge emqx API
    // Add device ban emqx API
    if (existingDevice) {
      const result = await Promise.allSettled([
        this.httpEmqxApiService.emqxApiDeleteBridge(
          existingDevice.bridgeRuleId,
        ),
        this.httpEmqxApiService.emqxApiPostAddBanned({
          as: 'clientid',
          who: existingDevice.deviceSerial,
          reason: 'Deleted by user',
        }),
      ]);

      result.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Error en operación ${index}:`, result.reason);
        }
      });
    }

    return {
      status: true,
      device: existingDevice,
    };
  }

  // Buscar todos los dispositivos | Find all devices
  public async findAllDevices(
    paginationDto: PaginationDto,
    userInfo: IUserInfo,
  ): Promise<{
    limit: number;
    offset: number;
    count: number;
    devices: DevicesEntity[];
  }> {
    const { userAccess, userId } = userInfo;
    const limit = paginationDto.limit || Number(process.env.LIMIT) || 1000;
    const offset = paginationDto.offset || Number(process.env.OFFSET) || 0;

    const queryBuilder = this.deviceRepository
      .createQueryBuilder('devices')
      .leftJoinAndSelect('devices.createUserId', 'createUserId')
      .take(limit)
      .skip(offset);

    if (userAccess === ACCESS_LEVEL.ADMIN) {
      queryBuilder.andWhere('devices.createUserId = :userId', { userId });
    }

    if (paginationDto.type) {
      queryBuilder.andWhere('devices.deviceType = :type', {
        type: paginationDto.type,
      });
    }

    const [devices, count] = await queryBuilder.getManyAndCount();

    return {
      limit,
      offset,
      count,
      devices,
    };
  }

  // EMQX DEMO
  public async testEmqxApi() {
    return this.httpEmqxApiService.emqxApiGetTopicList();
  }
}
