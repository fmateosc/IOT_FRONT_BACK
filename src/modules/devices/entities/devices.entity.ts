// src/modules/devices/entities/devices.entity.ts

import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import type { Relation } from 'typeorm';
import { BaseEntity } from "../../../config/base.entity.js";
import { DEVICE_TYPES } from "../../../constants/index.js";
import { UsersEntity } from "../../users/entities/users.entity.js";

@Entity({ name: 'devices' })
export class DevicesEntity extends BaseEntity {
  @Column({
    type: 'enum',
    enum: DEVICE_TYPES,
    default: 'ESP32',
  })
  deviceType: DEVICE_TYPES;

  @Column('text', { nullable: false })
  deviceName: string;

  @Column('text', { nullable: false, unique: true })
  deviceSerial: string;

  @Column('text', { nullable: true })
  deviceDescription: string;

  @Column('jsonb', { nullable: true })
  deviceLocation: { longitude: number; latitude: number };

  @Column('text', { nullable: true })
  bridgeRuleId: string;

  @Column('bool', { nullable: true })
  bridgeRuleEnabled: boolean;

  @Column('bool', { default: false })
  deviceOnline: boolean;

  @Column('bool', { default: true })
  deviceStatus: boolean;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  deviceLastseen: Date;

  @ManyToOne(
    'UsersEntity',
    (user: UsersEntity) => user.userDevices,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'device_user_id' })
  createUserId: Relation<UsersEntity>;
}
