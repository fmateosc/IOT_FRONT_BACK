// src/modules/auth/controllers/auth.controller.ts

import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import { AuthDto } from '../dtos/auth.dto.js';
import { AuthResponse } from '../intefaces/auth.interface.js';
import { AuthGuard } from '../guard/auth.guard.js';
import { AccessLevelGuard } from '../guard/access-level.guard.js';
import { PublicAccess } from '../decorators/public.decorator.js';
import { MqttService } from '../../providers/mqtt/mqtt.service.js';
import * as mqtt from 'mqtt';

@Controller('auth')
@UseGuards(AuthGuard, AccessLevelGuard)
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly mqttService: MqttService,
  ) {}

  // Login endpoint
  @PublicAccess()
  @Post('login')
  async login(@Body() { username, password }: AuthDto): Promise<AuthResponse> {
    const userValidate = await this.authService.validateUser(
      username,
      password,
    );

    if (!userValidate) {
      throw new HttpException(
        `Credenciales inválidas`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // TODO: MQTT
    const mqttObservable = this.mqttService.doConnectUser(
      userValidate.id,
      username,
      password,
    );

    mqttObservable.subscribe({
      next: (packet: mqtt.Packet) => {
        // Verificar que sea específicamente un paquete de tipo "publish"
        if (packet.cmd !== 'publish') {
          return;
        }

        // Aquí TypeScript ya sabe (narrowing) que packet es IPublishPacket
        this.logger.log(`Message received from topic: ${packet.topic}`);
        this.logger.log(`Payload: ${packet.payload.toString()}`);
        this.logger.log(`QoS: ${packet.qos}`);
        this.logger.log(`Retain flag: ${packet.retain}`);
        this.logger.log(`Duplicate flag: ${packet.dup}`);
      },
      error: (err) => {
        this.logger.error(`MQTT connect error: ${err}`);
      },
    });

    const { password: _, ...userWithoutPassword } = userValidate;
    const jwt = await this.authService.generateJWT(userWithoutPassword);

    return jwt;
  }
}
