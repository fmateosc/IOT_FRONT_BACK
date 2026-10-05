import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service.js';
import { AuthController } from './controllers/auth.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { AclEntity } from './entities/acl.entity.js';
import { MqttProviderModule } from '../providers/mqtt-provider.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // ACL entity
      AclEntity,
    ]),
    forwardRef(() => UsersModule),
    MqttProviderModule
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService, TypeOrmModule],
})
export class AuthModule {}
