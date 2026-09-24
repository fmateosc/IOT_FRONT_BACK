// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from './config/typeorm.js';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
