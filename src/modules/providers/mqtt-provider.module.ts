import { forwardRef, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { MqttService } from './mqtt/mqtt.service.js';

@Module({
  imports: [forwardRef(() => UsersModule), SettingsModule],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttProviderModule {}
