import { Module } from '@nestjs/common';
import { TaskService } from './services/task.service.js';
import { TaskController } from './controllers/task.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task.entity.js';
import { UsersModule } from '../../users/users.module.js';
import { MqttProviderModule } from '../../providers/mqtt-provider.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity]),
    UsersModule,
    MqttProviderModule,
  ],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService, TaskModule, TypeOrmModule]
})
export class TaskModule {}
