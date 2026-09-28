import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './services/users.service.js';
import { UsersController } from './controllers/users.controller.js';
import { UsersEntity } from './entities/users.entity.js';
import { AclEntity } from '../auth/entities/acl.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([UsersEntity, AclEntity])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
