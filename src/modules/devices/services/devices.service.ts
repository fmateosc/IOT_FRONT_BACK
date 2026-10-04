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
  // Versión mejorada | Improved version
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

    // TODO: API EMQX
    const isInitialized =
      await this.httpEmqxApiService.ensureSettingsInitialized();

    if (isInitialized) {
      try {
        // Crea el bridge y busca los baneados | Create the bridge and search for the banned ones
        const [respEmqxBridge, bannedList] = await Promise.all([
          this.httpEmqxApiService.emqxApiPostBridge({
            name: savedDevice.deviceName,
            user: savedDevice.createUserId.username || 'emqx',
            serialId: savedDevice.deviceSerial,
          }),
          this.httpEmqxApiService.emqxApiGetBannedList(),
        ]);
        // Actualiza el dispositivo con la data del bridge | Update the device with the bridge data
        const updatePromise = this.updateDeviceById(
          {
            bridgeRuleId: `${respEmqxBridge.type}:${respEmqxBridge.name}`,
            bridgeRuleEnabled: true, // new
          },
          savedDevice.id,
          userInfo,
        );

        const unbanPromise = this.checkWhoParameter(
          bannedList,
          savedDevice.deviceSerial,
        );

        // Ejecutar en paralelo y verificar errores | Run in parallel and check for errors
        const [updateResult, unbanResult] = await Promise.allSettled([
          updatePromise,
          unbanPromise,
        ]);

        const hasError = [updateResult, unbanResult].some(
          (r) => r.status === 'rejected',
        );

        if (hasError) {
          // Rollback si algo falló | Rollback if something went wrong
          await this.deviceRepository.delete(savedDevice.id);
          throw new HttpException(
            'One or more EMQX operations failed. Changes have been rolled back.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } catch (err) {
        // Rollback por cualquier excepción imprevista | Rollback for any unforeseen exceptions
        await this.deviceRepository.delete(savedDevice.id);
        throw new HttpException(
          'Failed to create device due to EMQX API error. Changes have been rolled back.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return {
      message: `Device "${savedDevice.deviceName}" with serial "${savedDevice.deviceSerial}" was created successfully`,
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
  // Versión mejorada | Improved version
  public async updateDeviceById(
    updateDeviceData: UpdateDeviceDto,
    deviceId: string,
    userInfo: IUserInfo,
  ): Promise<{ status: boolean; device: DevicesEntity }> {
    const existingDevice = await this.findDeviceById(deviceId, userInfo);

    await this.deviceRepository.update(deviceId, updateDeviceData);

    const ensureSettingsInitialized =
      await this.httpEmqxApiService.ensureSettingsInitialized();

    // TODO: update in EMQX API
    // Versión mejorada | Improved version
    // Baneo por cambio en deviceStatus | Ban due to change in deviceStatus
    if (
      ensureSettingsInitialized &&
      typeof updateDeviceData.deviceStatus === 'boolean' &&
      existingDevice.bridgeRuleId
    ) {
      if (existingDevice.deviceStatus === updateDeviceData.deviceStatus) {
        throw new HttpException(
          `The device is already ${updateDeviceData.deviceStatus ? 'enabled' : 'disabled'}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (updateDeviceData.deviceStatus) {
        await this.httpEmqxApiService.emqxApiDeleteBanned({
          as: 'clientid',
          who: existingDevice.deviceSerial,
        });
      } else {
        await this.httpEmqxApiService.emqxApiPostAddBanned({
          as: 'clientid',
          who: existingDevice.deviceSerial,
          reason: 'Disabled by User',
        });
      }
    }

    // Activación/desactivación del bridge / Bridge enable/disable
    if (
      typeof updateDeviceData.bridgeRuleEnabled === 'boolean' &&
      existingDevice.bridgeRuleId
    ) {
      if (
        updateDeviceData.bridgeRuleEnabled === existingDevice.bridgeRuleEnabled
      ) {
        throw new HttpException(
          `The device bridge rule is already ${updateDeviceData.bridgeRuleEnabled ? 'enabled' : 'disabled'}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.httpEmqxApiService.emqxApiPutEnableDisableBridge(
        existingDevice.bridgeRuleId,
        updateDeviceData.bridgeRuleEnabled,
      );
    }

    return {
      status: true,
      device: { ...existingDevice, ...updateDeviceData },
    };
  }

  // Eliminar un dispositivo por el Id | Delete a device by ID
  // Versión mejorada | Improved version
  public async deleteDeviceById(
    deviceId: string,
    userInfo: IUserInfo,
  ): Promise<{ status: boolean; device: DevicesEntity }> {
    const existingDevice = await this.findDeviceById(deviceId, userInfo);

    // Eliminar el dispositivo en base de datos | Delete the device from the database
    await this.deviceRepository.delete(deviceId);

    const ensureSettingsInitialized =
      await this.httpEmqxApiService.ensureSettingsInitialized();

    if (existingDevice && ensureSettingsInitialized) {
      const tasks: Promise<any>[] = [];

      // Solo elimina el bridge si hay uno | Only remove the bridge if there is one
      if (existingDevice.bridgeRuleId) {
        tasks.push(
          this.httpEmqxApiService.emqxApiDeleteBridge(
            existingDevice.bridgeRuleId,
          ),
        );
      }

      // Agrega al baneo | Add to ban
      tasks.push(
        this.httpEmqxApiService.emqxApiPostAddBanned({
          as: 'clientid',
          who: existingDevice.deviceSerial,
          reason: 'Deleted by User',
        }),
      );

      const results = await Promise.allSettled(tasks);

      const failed = results.find((result) => result.status === 'rejected');

      if (failed) {
        // Si algo falló, restauramos el dispositivo | If something went wrong, restore the device
        await this.createNewDevice(existingDevice, userInfo); // rollback
        throw new HttpException(
          'One or more EMQX operations failed. Changes have been rolled back.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
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
