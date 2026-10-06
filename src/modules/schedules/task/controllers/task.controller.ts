// src/modules/schedules/task/controllers/task.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../../auth/guard/auth.guard.js';
import { AccessLevelGuard } from '../../../auth/guard/access-level.guard.js';
import { TaskService } from '../services/task.service.js';
import { Access } from '../../../auth/decorators/access.decorator.js';
import { GetUserInfo } from '../../../auth/decorators/user.info.decorator.js';
import { TaskDto } from '../dtos/task.dto.js';
import { TaskEntity } from '../entities/task.entity.js';
import { UpdateTaskDto } from '../dtos/update.task.dto.js';
import * as authInterface from '../../../auth/intefaces/auth.interface.js';
import { PaginationDto } from '../../../../common/dtos/pagination.dto.js';

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

  @Access('ADMIN')
  @Get('find/:taskId')
  public async findTaskById(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @GetUserInfo() userInfo: authInterface.IUserInfo,
  ): Promise<TaskEntity> {
    return await this.taskService.findTaskById(taskId, userInfo);
  }

  @Access('ADMIN')
  @Put('update/:taskId')
  public async updateTaskById(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() updateTaskData: UpdateTaskDto,
    @GetUserInfo() userInfo: authInterface.IUserInfo,
  ): Promise<{ status: boolean; task: TaskEntity }> {
    return await this.taskService.updateTaskById(
      taskId,
      updateTaskData,
      userInfo,
    );
  }

  // buscar todas las tareas del sistema
  @Access('ADMIN')
  @Get('all')
  public async findAllTasks(
    @Query() paginationDto: PaginationDto,
    @GetUserInfo() userInfo: authInterface.IUserInfo,
  ): Promise<{
    limit: number;
    offset: number;
    count: number;
    tasks: TaskEntity[];
  }> {
    return await this.taskService.findAllTasks(paginationDto, userInfo);
  }

  // eliminar tarea del sistema y de BD
  @Access('ADMIN')
  @Delete('delete/:taskId')
  public async deleteTaskById(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @GetUserInfo() userInfo: authInterface.IUserInfo,
  ): Promise<{ status: boolean; task: TaskEntity }> {
    return await this.taskService.deleteTaskById(taskId, userInfo);
  }
}
