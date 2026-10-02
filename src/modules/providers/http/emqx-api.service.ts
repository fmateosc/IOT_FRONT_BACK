import { Injectable, Logger } from '@nestjs/common';
import { GeneralSettingsEntity } from '../../settings/entities/settings.entity.js';
import { HttpService } from '@nestjs/axios';
import { SettingsService } from '../../settings/services/settings.service.js';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import {
  IEmqxBannedParams,
  IEmqxBannedResponseData,
} from '../../../common/interfaces/emqx.interface.js';

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
                const detail = error.response?.data
                  ? JSON.stringify(error.response.data)
                  : error.message;
                this.logger.error(
                  `EMQX respondió ${error.response?.status}: ${detail}`,
                );
                throw new Error(`Ha ocurrido un error: ${detail}`);
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

  // demo list of topics
  public emqxApiGetTopicList(): Promise<any> {
    const url = `http://${this.dataSettings?.emqxAppHost}:${this.dataSettings?.emqxAppPort}/api/v5/bridges`;
    console.log("URL: ", url);
    return this.requestWithConfig('get', url);
  }

  // Bridge MQTT (broker) => HTTP (API core)
  public emqxApiPostBridge({
    name,
    user,
    serialId,
  }: {
    name: string;
    user: string;
    serialId: string;
  }): Promise<any> {
    const url = `http://${this.dataSettings?.emqxAppHost}:${this.dataSettings?.emqxAppPort}/api/v5/bridges`;
    console.log("URL: ", url);
    const data = {
      name: `http_${this.formatText(name)}`,
      type: 'webhook',
      ssl: { enable: false },
      connect_timeout: '15s',
      pool_size: 4,
      enable: true,
      method: 'post',
      url: `http://${this.configService.get('HTTP_HOST')}:${this.configService.get('HTTP_PORT')}/api/v1/messages/register`,
      max_retries: 3,
      request_timeout: '15s',
      pool_type: 'random',
      resource_opts: {
        worker_pool_size: 1,
        inflight_window: 100,
        health_check_interval: 15000,
        query_mode: 'async',
        max_buffer_bytes: 104857600,
      },
      enable_pipelining: 100,
      local_topic: `/${user}/+/${serialId}/#`, // /emqx1/000002/data1/equipo01
    };
    console.log("URL: ", url);
    console.log("Data: ", data);
    return this.requestWithConfig('post', url, data);
  }

  // These are formatted names.
  private formatText(text: string): string {
    return text.split(' ').join('_');
  }

  // Get the full banned list
  public emqxApiGetBannedList(): Promise<IEmqxBannedResponseData> {
    const url = `${this.dataSettings?.emqxAppHost}:${this.dataSettings?.emqxAppPort}/api/v5/banned`;

    return this.requestWithConfig('get', url);
  }

  // Delete from banned list
  public emqxApiDeleteBanned(params: IEmqxBannedParams): Promise<number> {
    const url = `${this.dataSettings?.emqxAppHost}:${this.dataSettings?.emqxAppPort}/api/v5/banned/${params.as}/${params.who}`;

    return this.requestWithConfig('delete', url);
  }
}
