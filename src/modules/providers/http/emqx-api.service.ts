import { Injectable, Logger } from '@nestjs/common';
import { GeneralSettingsEntity } from '../../settings/entities/settings.entity.js';
import { HttpService } from '@nestjs/axios';
import { SettingsService } from '../../settings/services/settings.service.js';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class EmqxApiService {
  private readonly logger = new Logger(EmqxApiService.name);
  private dataSettings?: GeneralSettingsEntity | null;

  constructor(
    private readonly emqxHttpService: HttpService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initializeSettings();
  }

  // **FUNCIONES**
  private async initializeSettings(): Promise<void> {
    this.dataSettings = await this.settingsService.findGeneralSettings();
  }

  private async requestWithConfig<T>(
    method: 'get' | 'post' | 'delete' | 'put',
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const settingsStatus = await this.ensureSettingsInitialized();
      
      if (settingsStatus) {
        // true
        const response = await firstValueFrom(
          this.emqxHttpService
            .request<T>({
              method,
              url,
              data,
              ...config,
              headers: {
                ...config?.headers,
                'User-Agent': 'iot-app/1.0.0',
                Authorization: `Basic ${this.encodeCredentials()}`,
              },
            })
            .pipe(
              catchError((error: AxiosError) => {
                throw new Error(`Ha ocurrido un error: ${error.message}`);
              }),
            ),
        );

        return response.data;
      }

      // false
      throw new Error('Settings not initialized');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(message);

      throw new Error(message);
    }
  }

  public async ensureSettingsInitialized(): Promise<boolean> {
    if (!this.dataSettings) {
      await this.initializeSettings();

      if (!this.dataSettings) {
        this.logger.error('No se han encontrado las configuraciones generales');

        return false;
      }
    }

    return true;
  }

  private encodeCredentials(): string {
    if (!this.dataSettings) {
      throw new Error(
        'No se han encontrado las configuraciones generales para codificar las credenciales',
      );
    }

    const credentials = `${this.dataSettings.emqxApiKey}:${this.dataSettings.emqxApiSecretKey}`;

    return Buffer.from(credentials).toString('base64');
  }
}
