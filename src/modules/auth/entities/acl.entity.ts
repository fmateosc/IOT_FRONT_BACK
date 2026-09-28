// src/modules/auth/entities/acl.entity.ts

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../config/base.entity.js';
import type { UsersEntity } from '../../users/entities/users.entity.js';
import { ACL_ACTION, ACL_PERMISSION } from '../../../constants/index.js';

@Entity({ name: 'acl' })
export class AclEntity extends BaseEntity {
  @Column('text', {
    nullable: true,
    default: '',
  })
  ipaddress: string;

  @Column('text', {
    nullable: true,
    default: '',
  })
  username: string;

  @Column('text', {
    nullable: true,
    default: '',
  })
  clientid: string;

  @Column({ type: 'enum', enum: ACL_ACTION })
  action: ACL_ACTION;

  @Column({ type: 'enum', enum: ACL_PERMISSION })
  permission: ACL_PERMISSION;

  @Column('text', {
    nullable: false,
  })
  topic: string;

  @Column({ type: 'smallint' }) // 0, 1, 2
  qos: number;

  @Column({ type: 'smallint' }) // 0, 1
  retain: number;

  // users relationship
  @ManyToOne('UsersEntity', (user: UsersEntity) => user.aclRules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'create_user_id' })
  createUserId: UsersEntity;
}
