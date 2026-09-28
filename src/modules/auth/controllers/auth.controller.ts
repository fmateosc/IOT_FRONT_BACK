// src/modules/auth/controllers/auth.controller.ts

import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service.js';
import { AuthDto } from '../dtos/auth.dto.js';
import { AuthResponse } from '../intefaces/auth.interface.js';

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // Login endpoint
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

    const { password: _, ...userWithoutPassword } = userValidate;
    const jwt = await this.authService.generateJWT(userWithoutPassword);
    
    return jwt;
  }
}
