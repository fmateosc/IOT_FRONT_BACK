// src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger } from '@nestjs/common';
import { CORS } from './config/cors.js';
import { AllExceptionFilter } from './common/filters/http-exception.filter.js';
import { TimeOutInterceptor } from './common/interceptors/timeout.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Mensaje de errores globales
  app.useGlobalFilters(new AllExceptionFilter());

  // Interceptores globales
  app.useGlobalInterceptors(new TimeOutInterceptor());

  const logger = new Logger('Bootstrap');

  // Puertos
  const HTTP_PORT = process.env.HTTP_PORT || 3000;
  const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

  // cors
  app.enableCors(CORS);

  // prefix
  app.setGlobalPrefix('api/v1');

  // http
  app.listen(HTTP_PORT, () => {
    logger.log(`🚀 HTTP server inicializado en el puerto: ${HTTP_PORT}`);
  });
}
await bootstrap();
