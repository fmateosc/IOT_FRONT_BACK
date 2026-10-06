// src/modules/schedules/task/controllers/task.controller.ts

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../auth/guard/auth.guard.js';
import { AccessLevelGuard } from '../../../auth/guard/access-level.guard.js';
import { TaskService } from '../services/task.service.js';
import { Access } from '../../../auth/decorators/access.decorator.js';
import { GetUserInfo } from '../../../auth/decorators/user.info.decorator.js';
import { TaskDto } from '../dtos/task.dto.js';
import * as authInterface from '../../../auth/intefaces/auth.interface.js';
import { TaskEntity } from '../entities/task.entity.js';

@Controller('task')
@UseGuards(AuthGuard, AccessLevelGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Access('ADMIN')
  @Post('create')
  async createNewTask(
    @Body() newTaskData: TaskDto,
    @GetUserInfo() userInfo: authInterface.IUserInfo,
  ): Promise<{ message: string; task: TaskEntity }> {
    return this.taskService.createNewTask(newTaskData, userInfo);
  }
}
