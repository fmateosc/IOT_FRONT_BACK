import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeneralSettingsEntity } from '../entities/settings.entity.js';
import { GeneralSettinsDto } from '../dtos/settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(GeneralSettingsEntity)
    private readonly settingsRepository: Repository<GeneralSettingsEntity>,
  ) {}

  // add new settings
  public async createNewSettings(
    newSettingsData: GeneralSettinsDto,
  ): Promise<{ message: string; settings: GeneralSettingsEntity }> {
    const configSave = await this.settingsRepository.count();

    if (configSave) {
      throw new HttpException(
        'Ya existe la configuración en el sistema',
        HttpStatus.BAD_REQUEST,
      );
    }

    const savedSettings = await this.settingsRepository.save(newSettingsData);

    return {
      message: 'Configuración creada con éxito',
      settings: savedSettings,
    };
  }
}
