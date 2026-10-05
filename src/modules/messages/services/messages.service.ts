import { Injectable } from '@nestjs/common';
import { DevicesService } from '../../devices/services/devices.service.js';
import { IMqttMessage } from '../interfaces/mqtt.interface.js';

@Injectable()
export class MessagesService {
    constructor (
        private readonly deviceService: DevicesService
    ){}

    public async updateDeviceConnection(newMessageData: IMqttMessage): Promise<void>{
        const status: { connected: boolean } = JSON.parse(newMessageData.payload);

        await this.deviceService.updateDeviceConnection(newMessageData.clientid, status.connected);
    }
}
