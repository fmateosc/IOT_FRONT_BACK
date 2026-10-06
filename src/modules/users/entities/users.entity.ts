// src/modules/users/entities/users.entity.ts

import { Column, Entity, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseEntity } from '../../../config/base.entity.js';
import { ACCESS_LEVEL, USER_ORIGIN } from '../../../constants/index.js';
import { AclEntity } from '../../auth/entities/acl.entity.js';
import { DevicesEntity } from '../../devices/entities/devices.entity.js';
import { TaskEntity } from '../../schedules/task/entities/task.entity.js';

@Entity({ name: 'users' })
export class UsersEntity extends BaseEntity {
  @Column('text', {
    unique: true,
    nullable: false,
  })
  username: string;

  @Column('text', {
    select: false,
    nullable: false,
  })
  password: string;

  @Column({
    type: 'enum',
    enum: ACCESS_LEVEL,
    default: ACCESS_LEVEL.ADMIN, // 'ADMIN'
    nullable: false,
  })
  userAccess: ACCESS_LEVEL;

  @Column('text', {
    nullable: true,
  })
  userFullName: string;

  @Column('text', {
    unique: true,
    nullable: false,
  })
  userEmail: string;

  @Column('text', {
    nullable: true,
    default: '',
  })
  salt: string;

  @Column('bool', {
    default: false,
  })
  isSuperuser: boolean;

  @Column('text', {
    nullable: true,
    select: false,
  })
  userToken: string;

  @Column('bool', {
    default: false,
  })
  userLogin: boolean;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  userLastseen: Date;

  @Column('bool', {
    default: true,
  })
  userStatus: boolean;

  @Column('text', {
    nullable: true,
    default: USER_ORIGIN.WEB,
  })
  userOrigin: string;

  @OneToMany('AclEntity', (acl: AclEntity) => acl.createUserId)
  aclRules: Relation<AclEntity>[];

  @OneToMany('DevicesEntity', (device: DevicesEntity) => device.createUserId)
  userDevices: Relation<DevicesEntity>[];

  // task
  @OneToMany('TaskEntity', (task: TaskEntity) => task.createUserId)
  userTask: Relation<TaskEntity>[];
}
