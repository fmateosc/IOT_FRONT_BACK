// src/modules/devices/dtos/update.device.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { DeviceDto } from './devices.dto.js';

export class UpdateDeviceDto extends PartialType(DeviceDto) {}
