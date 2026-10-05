import { Body, Controller, Logger, Post } from '@nestjs/common';
import { MessagesService } from '../services/messages.service.js';
import type { IMqttMessage } from '../interfaces/mqtt.interface.js';

@Controller('messages')
//@UseGuards(AuthGuard, AccessLevelGuard) // add
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(private readonly messageService: MessagesService) {}

  //@PublicAccess() // add
  @Post('register')
  public async createNewMessage(@Body() newMessageData: IMqttMessage) {
    // verificar que status este presente en topic
    if (/\/status$/.test(newMessageData.topic)) {
      this.messageService.updateDeviceConnection(newMessageData);
    }

    this.logger.debug('Message received from MQTT');
    this.logger.debug(newMessageData);
    
    return true;
  }
}
