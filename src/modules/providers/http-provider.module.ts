import { Global, Module } from '@nestjs/common';
import { EmqxApiService } from './http/emqx-api.service.js';
import { HttpModule } from '@nestjs/axios';
import { SettingsModule } from '../settings/settings.module.js';
import { MqttProviderModule } from './mqtt-provider.module.js';
import { MqttService } from './mqtt/mqtt.service.js';

@Global()
@Module({
  imports: [
    HttpModule,
    SettingsModule,
    MqttProviderModule,
  ],
  providers: [EmqxApiService, MqttService],
  exports: [
    HttpModule,
    EmqxApiService
  ]
})
export class HttpProviderModule {}
