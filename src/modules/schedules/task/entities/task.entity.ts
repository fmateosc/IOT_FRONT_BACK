// src/modules/schedules/task/entities/task.entity.ts

import * as typeorm from 'typeorm';
import { BaseEntity } from '../../../../config/base.entity.js';
import { UsersEntity } from '../../../users/entities/users.entity.js';

@typeorm.Entity({ name: 'task' })
export class TaskEntity extends BaseEntity {
  @typeorm.Column('text', { unique: true, nullable: false })
  name: string;

  @typeorm.Column({ type: 'boolean' })
  status: boolean;

  @typeorm.Column({ type: 'simple-array' })
  days: string[]; // Almacena los días como un array de strings

  @typeorm.Column({ type: 'varchar', length: 255 })
  time: string; // Almacena la hora en formato 'HH:mm'

  @typeorm.Column({ nullable: true })
  timeZone?: string; // Agregar esta propiedad

  @typeorm.Column({ type: 'varchar', length: 255 })
  topic: string;

  @typeorm.Column({ type: 'jsonb', nullable: true }) // Cambiar a tipo jsonb
  command: { [key: string]: boolean | number }; // Almacena objetos JSON como {"output1": true} o {"dimmer1": 100}

  // relación de la tabla tareas a varios usuarios, al eliminar un usuario elimina la relación
  @typeorm.ManyToOne('UsersEntity', (user: UsersEntity) => user.userTask, {
    onDelete: 'CASCADE',
  })
  @typeorm.JoinColumn({ name: 'task_user_id' })
  createUserId: typeorm.Relation<UsersEntity>;
}
