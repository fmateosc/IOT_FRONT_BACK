import { forwardRef, Module } from '@nestjs/common';
import { SettingsService } from './services/settings.service.js';
import { SettingsController } from './controllers/settings.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralSettingsEntity } from './entities/settings.entity.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GeneralSettingsEntity
    ]),
    forwardRef(() => UsersModule),
  ],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [ SettingsModule, SettingsService, TypeOrmModule]
})
export class SettingsModule {}
