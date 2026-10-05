import { Injectable } from '@nestjs/common';
import { DevicesService } from '../../devices/services/devices.service.js';
import { IMqttMessage } from '../interfaces/mqtt.interface.js';

@Injectable()
export class MessagesService {
  constructor(private readonly deviceService: DevicesService) {}

  public async updateDeviceConnection(newMessageData: IMqttMessage): Promise<void> {
    const status: { connected: boolean } = JSON.parse(newMessageData.payload);

    // Extraer el serial del topic: /username/+/serial/status
    const topicParts = newMessageData.topic.split('/').filter(Boolean);
    const deviceSerial = topicParts[2];

    if (!deviceSerial) {
      return;
    }

    await this.deviceService.updateDeviceConnection(deviceSerial, status.connected);
  }
}
