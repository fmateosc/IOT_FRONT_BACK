import { Global, Module } from '@nestjs/common';
import { EmqxApiService } from './http/emqx-api.service.js';
import { HttpModule } from '@nestjs/axios';
import { SettingsModule } from '../settings/settings.module.js';

@Global()
@Module({
  imports: [
    HttpModule,
    SettingsModule,
  ],
  providers: [EmqxApiService],
  exports: [
    HttpModule,
    EmqxApiService
  ]
})
export class HttpProviderModule {}
