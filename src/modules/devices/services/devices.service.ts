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

    // Recuperar el dispositivo con la relación de usuario cargada (necesario para el username real)
    const deviceWithUser = await this.deviceRepository.findOne({
      where: { id: savedDevice.id },
      relations: { createUserId: true },
    });

    // API EMQX
    const isInitialized =
      await this.httpEmqxApiService.ensureSettingsInitialized();

    if (isInitialized) {
      try {
        const username = deviceWithUser?.createUserId?.username || 'emqx';
        const topic = `/${username}/+/${savedDevice.deviceSerial}/#`;

        // 1. Crear el connector y buscar los baneados en paralelo
        const [respConnector, bannedList] = await Promise.all([
          this.httpEmqxApiService.emqxApiPostConnector({
            name: savedDevice.deviceName,
          }),
          this.httpEmqxApiService.emqxApiGetBannedList(),
        ]);

        // 2. Crear la action (depende del connector)
        const respAction = await this.httpEmqxApiService.emqxApiPostAction({
          name: savedDevice.deviceName,
          connectorName: respConnector.name,
        });

        // 3. Crear la rule (depende de la action)
        const respRule = await this.httpEmqxApiService.emqxApiPostRule({
          topic,
          actionName: respAction.name,
        });

        // Actualiza el dispositivo con la data de la rule
        const updatePromise = this.updateDeviceById(
          {
            bridgeRuleId: respRule.id,
            bridgeRuleEnabled: true,
          },
          savedDevice.id,
          userInfo,
        );

        const unbanPromise = this.checkWhoParameter(
          bannedList,
          savedDevice.deviceSerial,
        );

        // Ejecutar en paralelo y verificar errores
        const [updateResult, unbanResult] = await Promise.allSettled([
          updatePromise,
          unbanPromise,
        ]);

        const hasError = [updateResult, unbanResult].some(
          (r) => r.status === 'rejected',
        );

        if (hasError) {
          await this.deviceRepository.delete(savedDevice.id);
          throw new HttpException(
            'One or more EMQX operations failed. Changes have been rolled back.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } catch (err) {
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

  // buscar por clave - valor
  public async findBy({
    key,
    value,
  }: {
    key: keyof DeviceDto;
    value: any;
  }): Promise<DevicesEntity | null> {
    const device = await this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.createUserId', 'createUserId')
      .where(`device.${key} = :value`, { value })
      .getOne();

    return device;
  }

  // Update device status (Actualizado evitar error)
  public async updateDeviceConnection(
    deviceSerial: string,
    status: boolean,
  ): Promise<void> {
    const device = await this.findBy({
      key: 'deviceSerial',
      value: deviceSerial,
    });

    if (!device) {
      this.logger.warn(`Device with serial "${deviceSerial}" not found`);

      return;
    }

    const userInfo: IUserInfo = {
      userId: device.createUserId.id,
      userAccess: device.createUserId.userAccess,
    };

    const data: UpdateDeviceDto = {
      deviceLastseen: new Date(),
      deviceOnline: status,
    };

    await this.updateDeviceById(data, device.id, userInfo);
  }
}
