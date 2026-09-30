import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../config/base.entity.js';

@Entity({ name: 'general_settings' })
export class GeneralSettingsEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 100, default: 'Atlantic/Canary' })
  timezone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emqxApiKey: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  emqxApiSecretKey: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'localhost',
  })
  emqxAppHost: string;

  @Column({ type: 'int', nullable: true, default: 18084 })
  emqxAppPort: number;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'emqx' })
  mqttApiUser: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'Fm12345678@',
  })
  mqttApiPassword: string;

  @Column({ type: 'int', nullable: true, default: 1883 })
  mqttApiPort: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  telegramBotToken: string;
}
