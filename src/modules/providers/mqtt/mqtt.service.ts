// src/modules/providers/mqtt/mqtt.service.ts

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { SettingsService } from '../../settings/services/settings.service.js';
import * as mqtt from 'mqtt';
import { GeneralSettingsEntity } from '../../settings/entities/settings.entity.js';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class MqttService implements OnModuleDestroy, OnModuleInit {
  private logger = new Logger(MqttService.name);

  private dataSettings?: GeneralSettingsEntity | null;
  private mqttClients: Map<string, mqtt.MqttClient> = new Map();
  private hostname: string;
  private brokerUrl: string;

  constructor(private readonly settingsService: SettingsService) {}

  async onModuleInit() {
    await this.initializeSettings();
  }

  private async initializeSettings(): Promise<void> {
    this.dataSettings = await this.settingsService.findGeneralSettings();

    if (!this.dataSettings) {
      this.logger.warn('No general settings found');
    }

    this.hostname = this.dataSettings?.emqxAppHost || 'localhost';

    // mqtt://localhost:1883
    this.brokerUrl = `mqtt://${this.hostname}:${this.dataSettings?.mqttApiPort}`;

    // conectar el usuario por defecto
    this.doConnectUser(
      'emqx',
      this.dataSettings?.mqttApiUser,
      this.dataSettings?.mqttApiPassword,
    );
  }

  // Conecta un usuario al broker MQTT | Connects a user to the MQTT broker.
  // Conecta un usuario al broker MQTT | Connects a user to the MQTT broker.
  doConnectUser(
    userId: string,
    username: string | undefined,
    password: string | undefined,
  ): Observable<mqtt.Packet> {
    // Si el usuario ya está conectado, se desconecta antes de continuar
    if (this.mqttClients.has(userId)) {
      this.logger.log(`User ${userId} is already connected to MQTT.`);
      this.doDisconnectUser(userId);
    }

    const mqttOptions: mqtt.IClientOptions = {
      clientId: `CoreApi_${Math.random().toString(16).slice(3)}`,
      username,
      password,
      clean: true,
      keepalive: 60,
      reconnectPeriod: 1000,
      connectTimeout: 30000,
    };

    const mqttClient = mqtt.connect(this.brokerUrl, mqttOptions);

    this.mqttClients.set(userId, mqttClient);

    // Cuando se establece la conexión al Broker
    // Suscribirse a un tópico para la escucha
    mqttClient.on('connect', () => {
      username === 'emqx'
        ? this.doSubscribe(mqttClient, `/+/#`, 0)
        : this.doSubscribe(mqttClient, `/${username}/#`, 0);
      this.logger.log(`Connected to MQTT broker at "${this.brokerUrl}"`);
    });

    const subject = new Subject<mqtt.Packet>();

    mqttClient.on('message', (topic, message) => {
      subject.next({
        cmd: 'publish', // Comando del paquete
        topic,
        payload: message,
        qos: 0,
        retain: false,
        dup: false,
      } as mqtt.IPublishPacket);
    });

    mqttClient.on('error', (err) => {
      subject.error(err);
    });

    mqttClient.on('close', () => {
      this.logger.log(`Connected to MQTT close for userId "${userId}"`);
      this.mqttClients.delete(userId);
      subject.complete();
    });

    return subject.asObservable();
  }

  // desconectar el usuario | disconnect user
  doDisconnectUser(userId: string) {
    const client = this.mqttClients.get(userId);

    if (client) {
      client.end();

      this.mqttClients.delete(userId);

      this.logger.log(`User "${userId}" disconnected from MQTT.`);
    }
  }

  // suscribirse a un topico | subscribe to a topic
  public doSubscribe = async (
    mqttClient: InstanceType<typeof mqtt.MqttClient>,
    topic: string,
    qos: 0 | 1 | 2 = 0,
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      mqttClient.subscribe(
        topic,
        { qos } as mqtt.IClientSubscribeOptions,
        (error, granted) => {
          if (error) {
            this.logger.error(
              `MQTT subscribe error for topic "${topic}": ${error}`,
            );

            return;
          }
          this.logger.log(
            `MQTT subscribe successfully for topic "${topic}": ${JSON.stringify(granted)}`,
          );

          resolve();
        },
      );
    });
  };

  // Publicar a un topico
  public doPublish = async (
    mqttClient: InstanceType<typeof mqtt.MqttClient>,
    topic: string,
    qos: 0 | 1 | 2 = 0,
    payload: string,
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      mqttClient.publish(
        topic,
        payload,
        { qos } as mqtt.IClientPublishOptions,
        (error) => {
          if (error) {
            this.logger.error(
              `MQTT publish error for topic ${topic}: ${error}`,
            );
            reject(error);
            return;
          } else {
            this.logger.log(
              `MQTT published successfully to topic ${topic}: ${payload}`,
            );
            resolve();
          }
        },
      );
    });
  };

  // traer el cliente MQTT por el Id del Broker
  public getMqttClientById(
    brokerId: string,
  ): InstanceType<typeof mqtt.MqttClient> | undefined {
    return this.mqttClients.get(brokerId);
  }

  // cierra conexiones al destruir el modulo | closes connections when destroying the module
  onModuleDestroy() {
    this.mqttClients.forEach((client, userId) => {
      client.end();
      this.logger.log(
        `User "${userId}" disconnected from MQTT during module destruction`,
      );
    });
    this.mqttClients.clear();
  }
}
