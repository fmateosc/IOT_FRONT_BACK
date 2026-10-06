// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm.js';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DevicesModule } from './modules/devices/devices.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { HttpProviderModule } from './modules/providers/http-provider.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';
import { TaskModule } from './modules/schedules/task/task.module.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const config = configService.get<TypeOrmModuleOptions>('typeorm');
        
        if(!config){
          throw new Error('TypeORM configuracion no se encuentra');
        }

        return config;
      }        
    }),
    UsersModule,
    AuthModule,
    DevicesModule,
    SettingsModule,
    HttpProviderModule,
    MessagesModule,
    TaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
