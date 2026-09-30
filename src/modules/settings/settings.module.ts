import { Module } from '@nestjs/common';
import { SettingsService } from './services/settings.service.js';
import { SettingsController } from './controllers/settings.controller.js';

@Module({
  providers: [SettingsService],
  controllers: [SettingsController]
})
export class SettingsModule {}
