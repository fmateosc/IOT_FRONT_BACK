//src/modules/schedules/task/services/task.service.ts

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TaskEntity } from '../entities/task.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CronJob } from 'cron';
import moment from 'moment-timezone';
import { MqttService } from '../../../providers/mqtt/mqtt.service.js';
import { UsersService } from '../../../users/services/users.service.js';
import { IUserInfo } from '../../../auth/intefaces/auth.interface.js';
import { TaskDto } from '../dtos/task.dto.js';
import { ACCESS_LEVEL } from '../../../../constants/index.js';
import { UpdateTaskDto } from '../dtos/update.task.dto.js';
import { PaginationDto } from '../../../../common/dtos/pagination.dto.js';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
    private readonly mqttService: MqttService,
    private readonly userService: UsersService,
  ) {}

  async onModuleInit() {
    const tasks = await this.getAllTasks();

    tasks.forEach((task) => this.addScheduleTask(task));
  }

  async getAllTasks(): Promise<TaskEntity[]> {
    const tasks = await this.taskRepository.find({
      relations: {
        createUserId: true,
      },
    });

    return tasks;
  }

  // metodo para crear un @CronJobs
  async addScheduleTask(task: TaskEntity): Promise<void> {
    const cronExpression = this.getCronExpression(task.days, task.time);

    const formattedDate = moment()
      .tz(task.timeZone || 'UTC')
      .format('YYYY-MM-DD HH:mm:ss');

    const job = new CronJob(
      cronExpression,
      () => {
        this.logger.log(
          `Task ${task.id} executed at ${formattedDate} TimeZone: (${task.timeZone})`,
        );

        // funcion para publicar por MQTT
        this.publishMessageMQTT(task);
      },
      null,
      true,
      task.timeZone,
    );

    this.schedulerRegistry.addCronJob(`task_${task.id}`, job);

    job.start();

    this.logger.log(
      `Cron job "task_${task.id}" added with expression "${cronExpression}" : "${formattedDate}"`,
    );
  }

  // crear un formato de cron
  private getCronExpression(days: string[], time: string): string {
    type DayKey =
      | 'monday'
      | 'tuesday'
      | 'wednesday'
      | 'thursday'
      | 'friday'
      | 'saturday'
      | 'sunday'
      | 'all';

    const daysMap: Record<DayKey, string> = {
      monday: '1',
      tuesday: '2',
      wednesday: '3',
      thursday: '4',
      friday: '5',
      saturday: '6',
      sunday: '0',
      all: '*',
    };

    const dayExpression = days.includes('all')
      ? '*'
      : days.map((day) => daysMap[day.toLowerCase() as DayKey]).join(',');

    const [hour, minute] = time.split(':');

    return `${minute} ${hour} * * ${dayExpression}`;
  }

  // publicar por mqtt
  public async publishMessageMQTT(task: TaskEntity): Promise<void> {
    const mqttClient = this.mqttService.getMqttClientById('emqx');

    if (mqttClient && task.status) {
      const topic = task.topic;
      const qos = 0;
      const payloadString = JSON.stringify(task.command);

      if (payloadString !== undefined) {
        // Mqtt
        this.mqttService.doPublish(mqttClient, topic, qos, payloadString);
      } else {
        this.logger.error(
          'Payload string is undefined. Cannot publish empty payload',
        );
      }
    } else {
      this.logger.error(
        `MQTT client not found for the provided broker or task is not active`,
      );
    }
  }

  // crear tarea en base de datos
  async createNewTask(
    createTaskData: TaskDto,
    userInfo: IUserInfo,
  ): Promise<{ message: string; task: TaskEntity }> {
    const user = await this.userService.findUserById(userInfo.userId, userInfo);

    const task = this.taskRepository.create({
      ...createTaskData,
      topic: `/${user.username}/` + createTaskData.topic,
      createUserId: user ? user : undefined,
    });

    await this.taskRepository.save(task);

    // llamar a la creacion de la tarea en sistema
    this.addScheduleTask(task);
    return {
      message: `Task "${task?.name}" was created successfully`,
      task,
    };
  }

  // buscar una tarea por el Id
  public async findTaskById(
    taskId: string,
    userInfo: IUserInfo,
  ): Promise<TaskEntity> {
    const { userId, userAccess } = userInfo;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createUserId', 'createUserId')
      .where({ id: taskId });

    if (userAccess === ACCESS_LEVEL.ADMIN) {
      queryBuilder.andWhere('task.createUserId = :createUserId', {
        createUserId: userId,
      });
    }

    const taskResult = await queryBuilder.getOne();

    if (!taskResult) {
      throw new HttpException(
        `Task with Id: "${taskId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return taskResult;
  }

  // actualizar task por el id
  async updateTaskById(
    taskId: string,
    updateTaskData: UpdateTaskDto,
    userInfo: IUserInfo,
  ): Promise<{ status: boolean; task: TaskEntity }> {
    const task = await this.findTaskById(taskId, userInfo);

    if (updateTaskData.topic) {
      updateTaskData.topic =
        `/${task.createUserId.username}/` + updateTaskData.topic;
    }

    await this.taskRepository.update(task.id, updateTaskData);

    this.deleteCronJob(`task_${task.id}`);
    this.addScheduleTask({ ...task, ...updateTaskData });

    return {
      status: true,
      task: { ...task, ...updateTaskData },
    };
  }

  // Eliminar un cronJob del sistema
  private deleteCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);

    this.logger.debug(`Cron job "${name}" deleted`);
  }

  // buscar todas las tareas
  public async findAllTasks(
    paginationDto: PaginationDto,
    userInfo: IUserInfo,
  ): Promise<{
    limit: number;
    offset: number;
    count: number;
    tasks: TaskEntity[];
  }> {
    const { userId, userAccess } = userInfo;
    const limit = paginationDto.limit || Number(process.env.LIMIT) || 1000;
    const offset = paginationDto.offset || Number(process.env.OFFSET) || 0;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('tasks')
      .leftJoinAndSelect('tasks.createUserId', 'createUserId')
      .take(limit)
      .skip(offset);

    if (userAccess === ACCESS_LEVEL.ADMIN) {
      queryBuilder.where('tasks.createUserId = :createUserId', {
        createUserId: userId,
      });
    }

    const [tasks, count] = await queryBuilder.getManyAndCount();

    return {
      limit,
      offset,
      count,
      tasks,
    };
  }
}
